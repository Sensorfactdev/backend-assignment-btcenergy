import { getBlock, getBlocksForDay } from './blockchainApi'
import { blockEnergyKwh, transactionEnergyKwh } from './energy'

export interface TransactionWithEnergy {
  txId: string
  size: number
  energyConsumptionKwh: number
}

export interface BlockWithEnergy {
  hash: string
  height: number
  time: number
  transactions: TransactionWithEnergy[]
  totalEnergyConsumptionKwh: number
}

export async function getBlockWithEnergy(hash: string): Promise<BlockWithEnergy> {
  const block = await getBlock(hash)
  return {
    hash: block.hash,
    height: block.height,
    time: block.time,
    transactions: block.tx.map((tx) => ({
      txId: tx.txId,
      size: tx.size,
      energyConsumptionKwh: transactionEnergyKwh(tx.size),
    })),
    totalEnergyConsumptionKwh: blockEnergyKwh(block),
  }
}

export interface DailyEnergyConsumption {
  date: string
  blockCount: number
  totalEnergyConsumptionKwh: number
}

// Walks backwards from today (UTC calendar days) for days, fetching
// every block mined each day and summing their transactions' energy cost.
// Known scaling limit: a BTC day has around 150 blocks, and blockchain.info's
// /rawblock response (the only way to get per-transaction sizes) can be
// several MB per block. Recomputing this on every request exceeds timeout.
// In real world, we usually have an indexer, that runs as a background job, 
// and stores the daily energy consumption in a DB for fast retrieval.

// `maxBlocksPerDay` is a dev/demo escape : it truncates the
// blocks summed per day so the query returns inside the sync timeout for testing. 

export async function getDailyEnergy(days: number, maxBlocksPerDay?: number): Promise<DailyEnergyConsumption[]> {
  const today = new Date()
  const results: DailyEnergyConsumption[] = []

  for (let i = 0; i < days; i++) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
    const blockSummaries = await getBlocksForDay(day.getTime())
    const limitedSummaries =
      maxBlocksPerDay === undefined ? blockSummaries : blockSummaries.slice(0, maxBlocksPerDay)
    const blocks = await Promise.all(limitedSummaries.map((summary) => getBlock(summary.hash)))

    results.push({
      date: day.toISOString().slice(0, 10),
      blockCount: blocks.length,
      totalEnergyConsumptionKwh: blocks.reduce((total, block) => total + blockEnergyKwh(block), 0),
    })
  }

  return results
}
