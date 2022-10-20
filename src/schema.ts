import { SchemaComposer } from 'graphql-compose'

const schemaComposer = new SchemaComposer()

schemaComposer.Query.addFields({
  hello: {
    type: () => 'String!',
    resolve: () => 'Hi there, good luck with the assignment!',
  },
})

export const schema = schemaComposer.buildSchema()
