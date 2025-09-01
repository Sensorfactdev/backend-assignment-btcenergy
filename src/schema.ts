import { SchemaComposer } from 'graphql-compose'
import { energyResolvers } from './resolvers/energyResolvers'
import { bitcoinApiService } from './services/bitcoinApi'

const schemaComposer = new SchemaComposer()

// Define GraphQL types
const EnergyConsumptionTC = schemaComposer.createObjectTC({
  name: 'EnergyConsumption',
  fields: {
    transactionHash: 'String!',
    energyKwh: 'Float!',
    sizeBytes: 'Int!',
    timestamp: 'Float!',
    blockHash: 'String!',
  },
})

const DailyEnergyConsumptionTC = schemaComposer.createObjectTC({
  name: 'DailyEnergyConsumption',
  fields: {
    date: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
    blockCount: 'Int!',
  },
})

const BlockEnergyDataTC = schemaComposer.createObjectTC({
  name: 'BlockEnergyData',
  fields: {
    blockHash: 'String!',
    height: 'Int!',
    timestamp: 'Float!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
    transactions: [EnergyConsumptionTC],
  },
})

const WalletEnergyDataTC = schemaComposer.createObjectTC({
  name: 'WalletEnergyData',
  fields: {
    address: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
    transactions: [EnergyConsumptionTC],
  },
})

const CacheStatsTC = schemaComposer.createObjectTC({
  name: 'CacheStats',
  fields: {
    redisConnected: 'Boolean!',
    memoryEntries: 'Int!',
    connectionAttempted: 'Boolean!',
  },
})

// Define Query fields
schemaComposer.Query.addFields({
  hello: {
    type: 'String!',
    resolve: () => 'Hi there, good luck with the assignment!',
  },

  // Priority 1: Energy consumption per transaction for a specific block
  blockEnergyConsumption: {
    type: BlockEnergyDataTC,
    args: {
      blockHash: 'String!',
    },
    resolve: async (_, { blockHash }) => {
      return energyResolvers.getBlockEnergyConsumption(blockHash)
    },
  },

  // Priority 2: Total energy consumption per day in the last x days
  dailyEnergyConsumption: {
    type: [DailyEnergyConsumptionTC],
    args: {
      days: {
        type: 'Int!',
        defaultValue: 7,
        description: 'Number of days to retrieve (default: 7, max: 30)',
      },
    },
    resolve: async (_, { days }) => {
      // Limit to prevent excessive API calls
      const limitedDays = Math.min(Math.max(days, 1), 30)
      return energyResolvers.getDailyEnergyConsumption(limitedDays)
    },
  },

  // Expert Feature: Energy consumption for a specific wallet address
  walletEnergyConsumption: {
    type: WalletEnergyDataTC,
    args: {
      address: 'String!',
      limit: {
        type: 'Int',
        defaultValue: 50,
        description: 'Maximum number of transactions to analyze (default: 50, max: 200)',
      },
    },
    resolve: async (_, { address, limit }) => {
      // Limit to prevent excessive processing
      const limitedTransactions = Math.min(Math.max(limit || 50, 1), 200)
      return energyResolvers.getWalletEnergyConsumption(address, limitedTransactions)
    },
  },

  // Helper: Single transaction energy consumption
  transactionEnergyConsumption: {
    type: EnergyConsumptionTC,
    args: {
      txHash: 'String!',
    },
    resolve: async (_, { txHash }) => {
      return energyResolvers.getTransactionEnergyConsumption(txHash)
    },
  },

  // Helper: Latest block energy information
  latestBlockEnergy: {
    type: BlockEnergyDataTC,
    args: {
      forceFresh: {
        type: 'Boolean',
        defaultValue: null,
        description: 'Force fresh data from API (true) or allow cached data (false). If not specified, uses environment default.',
      },
    },
    resolve: async (_, { forceFresh }) => {
      return energyResolvers.getLatestBlockEnergy(forceFresh)
    },
  },

  // Cache statistics
  cacheStats: {
    type: CacheStatsTC,
    description: 'Get cache statistics including Redis connection status and memory cache size',
    resolve: async () => {
      return bitcoinApiService.getCacheStats()
    },
  },
})

export const schema = schemaComposer.buildSchema()
