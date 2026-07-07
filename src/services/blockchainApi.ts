import type { RawBlock, RawBlockSummary } from '../types/blockchain'
import { getOrSet } from './cache'

const BASE_URL = 'https://blockchain.info'

// A block's own data (by hash) never changes once mined, so it's cached
// forever. The day-blocks list is a rolling window that can still be
// growing (e.g. "today"), so it gets a short TTL instead of "forever".
const BLOCK_TTL_SECONDS = null
const BLOCKS_FOR_DAY_TTL_SECONDS = 300

// Every network call to blockchain.info funnels through this one function,
// wrapped in the in-memory cache from ./cache (see that file for its
// scope/limitations).
async function fetchJson<T>(path: string, ttlSeconds: number | null): Promise<T> {
  return getOrSet(`blockchain-api:${path}`, ttlSeconds, async () => {
    const response = await fetch(`${BASE_URL}${path}`)
    if (!response.ok) {
      throw new Error(`blockchain.info request failed (${response.status}): ${path}`)
    }
    return (await response.json()) as T
  })
}

interface RawBlockResponse {
  hash: string
  height: number
  time: number
  tx: Array<{ hash: string; size: number }>
}

export async function getBlock(hash: string): Promise<RawBlock> {
  const raw = await fetchJson<RawBlockResponse>(`/rawblock/${hash}`, BLOCK_TTL_SECONDS)
  return {
    hash: raw.hash,
    height: raw.height,
    time: raw.time,
    tx: raw.tx.map((t) => ({ txId: t.hash, size: t.size })),
  }
}

export async function getBlocksForDay(dayStartMs: number): Promise<RawBlockSummary[]> {
  return fetchJson<RawBlockSummary[]>(`/blocks/${dayStartMs}?format=json`, BLOCKS_FOR_DAY_TTL_SECONDS)
}
