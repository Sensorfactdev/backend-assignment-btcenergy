import { SchemaComposer } from 'graphql-compose'
import { GraphQLError } from 'graphql'
import { getBlockWithEnergy, getDailyEnergy } from './services/blockEnergy'

const schemaComposer = new SchemaComposer()

const TransactionTC = schemaComposer.createObjectTC(`
  type Transaction {
    txId: String!
    size: Int!
    energyConsumptionKwh: Float!
  }
`)

const BlockTC = schemaComposer.createObjectTC({
  name: 'Block',
  fields: {
    hash: 'String!',
    height: 'Int!',
    time: 'Int!',
    transactions: [TransactionTC],
    totalEnergyConsumptionKwh: 'Float!',
  },
})

const DailyEnergyConsumptionTC = schemaComposer.createObjectTC(`
  type DailyEnergyConsumption {
    date: String!
    blockCount: Int!
    totalEnergyConsumptionKwh: Float!
  }
`)

schemaComposer.Query.addFields({
  block: {
    type: BlockTC,
    args: { hash: 'String!' },
    resolve: async (_source, args: { hash: string }) => {
      try {
        return await getBlockWithEnergy(args.hash)
      } catch (error) {
        throw new GraphQLError(
          `Could not find block with hash "${args.hash}"`,
          undefined,
          undefined,
          undefined,
          undefined,
          error instanceof Error ? error : undefined,
        )
      }
    },
  },
  dailyEnergyConsumption: {
    type: [DailyEnergyConsumptionTC],
    args: { days: 'Int!' },
    resolve: async (_source, args: { days: number }) => getDailyEnergy(args.days),
  },
})

export const schema = schemaComposer.buildSchema()
