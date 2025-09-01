import { bitcoinApiService } from '../services/bitcoinApi'
import {
  EnergyConsumption,
  DailyEnergyConsumption,
  BlockEnergyData,
  WalletEnergyData,
  BitcoinBlock,
  BitcoinTransaction
} from '../types/bitcoin'

export class EnergyResolvers {
  
  /**
   * Priority 1: Provide the energy consumption per transaction for a specific block
   */
  async getBlockEnergyConsumption(blockHash: string): Promise<BlockEnergyData> {
    try {
      const block = await bitcoinApiService.getBlock(blockHash)
      
      const transactions: EnergyConsumption[] = block.tx.map(tx => ({
        transactionHash: tx.hash,
        energyKwh: bitcoinApiService.calculateTransactionEnergy(tx.size),
        sizeBytes: tx.size,
        timestamp: block.time * 1000, // Convert to milliseconds
        blockHash: block.hash
      }))

      const totalEnergyKwh = transactions.reduce((sum, tx) => sum + tx.energyKwh, 0)

      return {
        blockHash: block.hash,
        height: block.height,
        timestamp: block.time * 1000,
        totalEnergyKwh,
        transactionCount: block.n_tx,
        transactions
      }
    } catch (error) {
      console.error('Error getting block energy consumption:', error)
      throw new Error(`Failed to get energy consumption for block ${blockHash}`)
    }
  }

  /**
   * Priority 2: Provide the total energy consumption per day in the last x number of days
   */
  async getDailyEnergyConsumption(days: number): Promise<DailyEnergyConsumption[]> {
    try {
      const results: DailyEnergyConsumption[] = []
      const now = Date.now()

      for (let i = 0; i < days; i++) {
        const dayStart = now - (i * 24 * 60 * 60 * 1000)
        const dayDate = new Date(dayStart)
        const dateString = dayDate.toISOString().split('T')[0]

        try {
          const blocksData = await bitcoinApiService.getBlocksInDay(dayStart)
          
          let totalEnergy = 0
          let totalTransactions = 0

          // Process each block in the day
          for (const blockInfo of blocksData.blocks) {
            if (blockInfo.main_chain) {
              try {
                const block = await bitcoinApiService.getBlock(blockInfo.hash)
                totalEnergy += bitcoinApiService.calculateBlockEnergy(block)
                totalTransactions += block.n_tx
              } catch (blockError) {
                console.warn(`Failed to get block ${blockInfo.hash}:`, blockError)
                // Continue with other blocks
              }
            }
          }

          results.push({
            date: dateString,
            totalEnergyKwh: totalEnergy,
            transactionCount: totalTransactions,
            blockCount: blocksData.blocks.filter(b => b.main_chain).length
          })
        } catch (dayError) {
          console.warn(`Failed to get data for day ${dateString}:`, dayError)
          // Add empty data for this day
          results.push({
            date: dateString,
            totalEnergyKwh: 0,
            transactionCount: 0,
            blockCount: 0
          })
        }
      }

      return results.reverse() // Return chronologically
    } catch (error) {
      console.error('Error getting daily energy consumption:', error)
      throw new Error(`Failed to get daily energy consumption for ${days} days`)
    }
  }

  /**
   * Expert Feature: Provide the total energy consumption of all transactions performed by a specific wallet address
   */
  async getWalletEnergyConsumption(address: string, limit?: number): Promise<WalletEnergyData> {
    try {
      const walletInfo = await bitcoinApiService.getWalletInfo(address)
      
      const transactions: EnergyConsumption[] = []
      const txsToProcess = limit ? walletInfo.txs.slice(0, limit) : walletInfo.txs

      for (const tx of txsToProcess) {
        try {
          // Get full transaction details if needed
          const fullTx = tx.size ? tx : await bitcoinApiService.getTransaction(tx.hash)
          
          transactions.push({
            transactionHash: fullTx.hash,
            energyKwh: bitcoinApiService.calculateTransactionEnergy(fullTx.size),
            sizeBytes: fullTx.size,
            timestamp: fullTx.time * 1000,
            blockHash: fullTx.block_index ? fullTx.block_index.toString() : 'unknown'
          })
        } catch (txError) {
          console.warn(`Failed to get transaction ${tx.hash}:`, txError)
          // Continue with other transactions
        }
      }

      const totalEnergyKwh = transactions.reduce((sum, tx) => sum + tx.energyKwh, 0)

      return {
        address,
        totalEnergyKwh,
        transactionCount: transactions.length,
        transactions
      }
    } catch (error) {
      console.error('Error getting wallet energy consumption:', error)
      throw new Error(`Failed to get energy consumption for wallet ${address}`)
    }
  }

  /**
   * Helper: Get energy consumption for a single transaction
   */
  async getTransactionEnergyConsumption(txHash: string): Promise<EnergyConsumption> {
    try {
      const tx = await bitcoinApiService.getTransaction(txHash)
      
      return {
        transactionHash: tx.hash,
        energyKwh: bitcoinApiService.calculateTransactionEnergy(tx.size),
        sizeBytes: tx.size,
        timestamp: tx.time * 1000,
        blockHash: tx.block_index ? tx.block_index.toString() : 'unknown'
      }
    } catch (error) {
      console.error('Error getting transaction energy consumption:', error)
      throw new Error(`Failed to get energy consumption for transaction ${txHash}`)
    }
  }

  /**
   * Helper: Get latest block energy information
   */
  async getLatestBlockEnergy(forceFresh?: boolean): Promise<BlockEnergyData> {
    try {
      console.log('🚀 getLatestBlockEnergy called with forceFresh:', forceFresh)
      debugger;
      // User can control freshness per query, with smart default
      const forceRefresh = forceFresh
      console.log('🔍 About to call getLatestBlock with forceRefresh:', forceRefresh)
      const latestBlock = await bitcoinApiService.getLatestBlock(forceRefresh)
      console.log('📦 Got latest block:', latestBlock.hash)
      return this.getBlockEnergyConsumption(latestBlock.hash)
    } catch (error) {
      console.error('Error getting latest block energy:', error)
      throw new Error('Failed to get latest block energy consumption')
    }
  }
  //test
}

export const energyResolvers = new EnergyResolvers()
