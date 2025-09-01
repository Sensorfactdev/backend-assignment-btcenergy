import fetch from 'node-fetch'
import {
  BitcoinBlock,
  BitcoinTransaction,
  LatestBlock,
  BlocksInDay,
  WalletInfo
} from '../types/bitcoin'
import { cacheService } from './cacheService'

// Energy cost per byte in KwH
const ENERGY_COST_PER_BYTE = 4.56

export class BitcoinApiService {
  private readonly baseUrl = 'https://blockchain.info'
  private readonly cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private readonly latestBlockCacheExpiry = 1 * 60 * 1000 // 1 minute for latest block
  private readonly fetchTimeout = 15000 // 15 seconds timeout for external API calls

  private async fetchWithCache<T>(url: string, cacheKey: string, customExpiry?: number): Promise<T> {
    const expiry = customExpiry || this.cacheExpiry
    const now = Date.now()
    
    // Check cache first
    const cached = await cacheService.get(cacheKey)
    
    if (cached && now - cached.timestamp < expiry) {      
      return cached.data
    }
    
    try {
      // Create a timeout promise that rejects after the specified timeout
      const fetchPromise = fetch(url, {
        headers: {
          'User-Agent': 'BTC-Energy-Monitor/1.0'
        }
      })
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${this.fetchTimeout}ms`)), this.fetchTimeout)
      })
      
      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as T
      
      // Cache the result with TTL
      await cacheService.set(cacheKey, data, expiry)
      return data
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      
      // If we have cached data and this is a timeout/network error, use cache as fallback
      if (cached && (error instanceof Error && 
          (error.message.includes('timeout') || error.message.includes('fetch')))) {
        console.log(`Using cached data as fallback for ${cacheKey}`)
        return cached.data
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch data from blockchain API: ${errorMessage}`)
    }
  }

  async getLatestBlock(forceRefresh: boolean = false): Promise<LatestBlock> {
    if (forceRefresh) {
      // Clear cache for latest block to force fresh fetch
      await cacheService.delete('latest-block')
    }
    
    return this.fetchWithCache<LatestBlock>(
      `${this.baseUrl}/latestblock`,
      'latest-block',
      this.latestBlockCacheExpiry // Use shorter cache for latest block
    )
  }

  async getBlock(blockHash: string): Promise<BitcoinBlock> {
    return this.fetchWithCache<BitcoinBlock>(
      `${this.baseUrl}/rawblock/${blockHash}`,
      `block-${blockHash}`
    )
  }

  async getTransaction(txHash: string): Promise<BitcoinTransaction> {
    return this.fetchWithCache<BitcoinTransaction>(
      `${this.baseUrl}/rawtx/${txHash}`,
      `tx-${txHash}`
    )
  }

  async getBlocksInDay(timeInMilliseconds: number): Promise<BlocksInDay> {
    return this.fetchWithCache<BlocksInDay>(
      `${this.baseUrl}/blocks/${timeInMilliseconds}?format=json`,
      `blocks-day-${timeInMilliseconds}`
    )
  }

  async getWalletInfo(address: string): Promise<WalletInfo> {
    return this.fetchWithCache<WalletInfo>(
      `${this.baseUrl}/rawaddr/${address}`,
      `wallet-${address}`
    )
  }

  calculateTransactionEnergy(sizeBytes: number): number {
    return sizeBytes * ENERGY_COST_PER_BYTE
  }

  calculateBlockEnergy(block: BitcoinBlock): number {
    return block.tx.reduce((total, tx) => total + this.calculateTransactionEnergy(tx.size), 0)
  }

  // Get cache statistics and health
  getCacheStats(): any {
    return cacheService.getStats()
  }

  // Clear expired cache entries - now handled by cacheService
  clearExpiredCache(): void {
    // This is now handled automatically by the cacheService
    // Keep the method for backward compatibility
    console.log('Cache cleanup is now handled automatically by cacheService')
  }
}

export const bitcoinApiService = new BitcoinApiService()

// The cache cleanup is now handled automatically by the cacheService
// No need for setInterval here anymore
