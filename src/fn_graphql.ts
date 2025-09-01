import { schema } from './schema'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import CreateLambdaApi from 'lambda-api'
import { getGraphQLParameters, processRequest, renderGraphiQL } from 'graphql-helix'
import type { API, HandlerFunction } from 'lambda-api'
import type { GraphQLSchema } from 'graphql'

export function APIGatewayLambda() {
  const isTest = process.env.NODE_ENV === 'test'
  const isOffline = process.env.IS_OFFLINE === 'true'

  return CreateLambdaApi({
    version: 'v2',
    logger: isTest ? false :{
      level: isOffline ? 'debug' : 'info'
    }
  })
}

export const graphqlApi = /*#__PURE__*/ <TContext>(
  schema: GraphQLSchema,
  contextFactory?: () => Promise<TContext> | TContext,
): HandlerFunction => {
  return async function graphqlHandler(req, res) {
    try {
      // Check if this is a GET request and should render GraphiQL interface
      if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
        res.header('Content-Type', 'text/html')
        res.send(renderGraphiQL({
          endpoint: '/',
        }))
        return
      }

      // Ensure proper content-type handling
      const contentType = req.headers['content-type'] || req.headers['Content-Type'] || ''
      
      // Handle different request formats
      let requestBody = req.body
      
      // If body is a string, try to parse it as JSON
      if (typeof requestBody === 'string') {
        try {
          requestBody = JSON.parse(requestBody)
        } catch (e) {
          // If it's not valid JSON, leave it as string for GET requests
        }
      }

      const request = {
        body: requestBody,
        headers: req.headers,
        method: req.method,
        query: req.query,
      }

      const { query, variables, operationName } = getGraphQLParameters(request)

      // Add validation to ensure we have a query
      if (!query) {
        res.status(400).json({
          errors: [{ message: 'Must provide query string.' }]
        })
        return
      }

      const result = await processRequest({
        schema,
        query,
        variables,
        operationName,
        request,
        contextFactory,
      })

      if (result.type === 'RESPONSE') {
        result.headers.forEach(({ name, value }: { name: string; value: string }) => {
          res.header(name, value)
        })
        res.status(result.status)
        res.json(result.payload)
      } else {
        req.log.error(`Unhandled: ${result.type}`)
        res.status(500).json({
          errors: [{ message: `Unhandled result type: ${result.type}` }]
        })
      }
    } catch (error) {
      req.log.error(`GraphQL handler error: ${error}`)
      res.status(500).json({
        errors: [{ message: 'Internal server error' }]
      })
    }
  }
}

export function mkAPIGatewayHandler(api: API): APIGatewayProxyHandlerV2 {
  return async function apiGatewayHandler(event: any, ctx: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.run(event as any, ctx)
  }
}

const api = APIGatewayLambda()

api.any(graphqlApi(schema))

export const handler: APIGatewayProxyHandlerV2 = mkAPIGatewayHandler(api)
