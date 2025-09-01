import { createClient, RedisClientType } from 'redis'

// Load environment variables from .env file
import * as dotenv from 'dotenv'
dotenv.config()

interface CacheEntry {
  data: any
  timestamp: number
}

export class CacheService {
  private redisClient: RedisClientType | null = null
  private isRedisConnected: boolean = false
  private globalCache = new Map<string, CacheEntry>()
  private connectionAttempted: boolean = false

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    // Only attempt connection once
    if (this.connectionAttempted) {
      return
    }
    
    this.connectionAttempted = true

    try {
      debugger;
      // Get Redis configuration from environment variables
      const redisUrl = process.env.REDIS_URL
      const redisHost = process.env.REDIS_HOST
      const redisPort = process.env.REDIS_PORT
      const redisPassword = process.env.REDIS_PASSWORD
      const redisUsername = process.env.REDIS_USERNAME || 'default'
      const redisDatabase = process.env.REDIS_DATABASE || '0'

      // Skip Redis if no configuration is provided
      if (!redisUrl && !redisHost) {
        return
      }

      // Create Redis client with configuration
      let clientConfig: any = {}

      if (redisUrl) {
        // Use URL if provided
        clientConfig = {
          url: redisUrl,
          socket: {
            connectTimeout: 15000,
            commandTimeout: 5000
          }
        }
        
        // Only add TLS for Redis Cloud (rediss://)
        if (redisUrl.startsWith('rediss://')) {
          clientConfig.socket.tls = true
        }
      } else if (redisHost) {
        // Use socket configuration for Redis Cloud
        clientConfig = {
          username: redisUsername,
          password: redisPassword,
          socket: {
            host: redisHost,
            port: parseInt(redisPort || '6379'),
            tls: true, // Redis Cloud typically requires TLS
            connectTimeout: 10000, // 10 seconds timeout
            commandTimeout: 5000
          },
          database: redisDatabase
        }
      }

      console.log('🚀 Creating Redis client with config:', JSON.stringify(clientConfig, null, 2))
      this.redisClient = createClient(clientConfig)

      // Handle Redis connection events
      this.redisClient.on('error', (error) => {
        this.isRedisConnected = false
      })

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true
      })

      this.redisClient.on('ready', () => {
        this.isRedisConnected = true
      })

      this.redisClient.on('disconnect', () => {
        this.isRedisConnected = false
      })

      // Attempt to connect with longer timeout for Redis Cloud
      const connectPromise = this.redisClient.connect()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 15000) // 15 seconds for cloud
      })

      await Promise.race([connectPromise, timeoutPromise])
      
    } catch (error) {
      this.isRedisConnected = false
      this.redisClient = null
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        const redisValue = await this.redisClient.get(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue) as CacheEntry
          console.log(`Cache HIT (Redis): ${key}`)
          return parsed
        }
      }
    } catch (error) {
      console.warn(`Redis get error for key ${key}, falling back to in-memory:`, error instanceof Error ? error.message : 'Unknown error')
      this.isRedisConnected = false
    }

    // Fallback to in-memory cache
    const memoryValue = this.globalCache.get(key)
    if (memoryValue) {
      return memoryValue
    }

    return null
  }

  async set(key: string, data: any, ttlMs?: number): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    }

    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        const redisValue = JSON.stringify(entry)
        
        if (ttlMs && ttlMs > 0) {
          // Set with TTL in seconds
          await this.redisClient.setEx(key, Math.ceil(ttlMs / 1000), redisValue)
        } else {
          // Set without TTL
          await this.redisClient.set(key, redisValue)
        }
        
        return
      }
    } catch (error) {
      this.isRedisConnected = false
    }

    // Fallback to in-memory cache
    this.globalCache.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key)
      }
    } catch (error) {
      // Redis error - fall back to in-memory only
    }

    // Always delete from in-memory cache as well
    this.globalCache.delete(key)
  }

  async clear(): Promise<void> {
    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushDb()
      }
    } catch (error) {
      // Redis error - fall back to in-memory only
    }

    // Always clear in-memory cache as well
    this.globalCache.clear()
  }

  // Clean up expired entries from in-memory cache
  clearExpiredEntries(maxAge: number): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.globalCache.entries()) {
      if (now - entry.timestamp >= maxAge) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.globalCache.delete(key)
    })
  }

  // Get cache statistics
  getStats(): {
    redisConnected: boolean
    memoryEntries: number
    connectionAttempted: boolean
  } {
    return {
      redisConnected: this.isRedisConnected,
      memoryEntries: this.globalCache.size,
      connectionAttempted: this.connectionAttempted
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redisClient && this.isRedisConnected) {
      try {
        await this.redisClient.disconnect()
      } catch (error) {
        // Error disconnecting - ignore
      }
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Clean up expired cache entries periodically (only for in-memory cache)
setInterval(() => {
  cacheService.clearExpiredEntries(10 * 60 * 1000) // 10 minutes
}, 5 * 60 * 1000) // Check every 5 minutes
