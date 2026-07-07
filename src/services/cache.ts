interface CacheEntry {
  value: unknown
  expiresAt: number | null // epoch ms; null = never expires
}

const store = new Map<string, CacheEntry>()

// In-memory cache using Map. Would not work in a production environment 
// with multiple containers. In production use Redis.
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number | null,
  fetcher: () => Promise<T>,
): Promise<T> {
  const entry = store.get(key)
  if (entry && (entry.expiresAt === null || entry.expiresAt > Date.now())) {
    return entry.value as T
  }

  const value = await fetcher()
  store.set(key, {
    value,
    expiresAt: ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000,
  })
  return value
}
