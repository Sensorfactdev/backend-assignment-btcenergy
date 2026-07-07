import { getAddressTransactionsPage } from './blockchainApi'
import { transactionEnergyKwh } from './energy'

// blockchain.info's /rawaddr accepts limit up to at least 5000 - use the
// largest page size to minimize the number of requests for busy addresses.
const PAGE_SIZE = 5000

export interface WalletEnergyConsumption {
  address: string
  transactionCount: number
  totalEnergyConsumptionKwh: number
}

// Note: busy exchange wallet with
// millions of transactions is still many requests and can hit the same
// sync-timeout ceiling as the daily energy feature. `maxTransactions` is
// the same dev/demo escape as `maxBlocksPerDay` - when set, the
// result reflects only that many (most recent) transactions
export async function getWalletEnergy(
  address: string,
  maxTransactions?: number,
): Promise<WalletEnergyConsumption> {
  let offset = 0
  let totalTxCount = Infinity
  let transactionCount = 0
  let totalEnergyConsumptionKwh = 0

  while (offset < totalTxCount && (maxTransactions === undefined || transactionCount < maxTransactions)) {
    const page = await getAddressTransactionsPage(address, PAGE_SIZE, offset)
    totalTxCount = page.totalTxCount

    const remaining = maxTransactions === undefined ? page.transactions.length : maxTransactions - transactionCount
    const transactions = page.transactions.slice(0, remaining)

    transactionCount += transactions.length
    totalEnergyConsumptionKwh += transactions.reduce((total, tx) => total + transactionEnergyKwh(tx.size), 0)
    offset += PAGE_SIZE

    if (page.transactions.length === 0) break // safety net against an empty page
  }

  return { address, transactionCount, totalEnergyConsumptionKwh }
}
