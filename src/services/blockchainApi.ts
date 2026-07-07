import type { RawBlock, RawBlockSummary } from '../types/blockchain'

const BASE_URL = 'https://blockchain.info'

// Every network call to blockchain.info funnels through this one function.
// TODO: put caching
async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`blockchain.info request failed (${response.status}): ${path}`)
  }
  return (await response.json()) as T
}

interface RawBlockResponse {
  hash: string
  height: number
  time: number
  tx: Array<{ hash: string; size: number }>
}

export async function getBlock(hash: string): Promise<RawBlock> {
  const raw = await fetchJson<RawBlockResponse>(`/rawblock/${hash}`)
  return {
    hash: raw.hash,
    height: raw.height,
    time: raw.time,
    tx: raw.tx.map((t) => ({ txId: t.hash, size: t.size })),
  }
}

export async function getBlocksForDay(dayStartMs: number): Promise<RawBlockSummary[]> {
  return fetchJson<RawBlockSummary[]>(`/blocks/${dayStartMs}?format=json`)
}
