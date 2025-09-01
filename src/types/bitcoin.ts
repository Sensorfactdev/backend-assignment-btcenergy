// Bitcoin API response types
export interface BitcoinBlock {
  hash: string
  height: number
  time: number
  block_index: number
  tx: BitcoinTransaction[]
  n_tx: number
  size: number
  main_chain: boolean
  received_time: number
  relayed_by: string
  bits: number
  nonce: number
  fee: number
  prev_block: string
  mrkl_root: string
  version: number
  weight: number
}

export interface BitcoinTransaction {
  hash: string
  size: number
  block_index?: number
  time: number
  tx_index: number
  version: number
  lock_time: number
  fee: number
  inputs: TransactionInput[]
  out: TransactionOutput[]
  result?: number
  balance?: number
  block_height?: number
  relayed_by?: string
  weight: number
}

export interface TransactionInput {
  sequence: number
  witness: string
  script: string
  index: number
  prev_out: {
    spent: boolean
    script: string
    spending_outpoints: any[]
    tx_index: number
    type: number
    addr?: string
    value: number
    n: number
  }
}

export interface TransactionOutput {
  type: number
  spent: boolean
  value: number
  spending_outpoints: any[]
  n: number
  tx_index: number
  script: string
  addr?: string
}

export interface LatestBlock {
  hash: string
  time: number
  block_index: number
  height: number
  txIndexes: number[]
}

export interface BlocksInDay {
  blocks: Array<{
    hash: string
    height: number
    time: number
    main_chain: boolean
  }>
}

export interface WalletInfo {
  hash160: string
  address: string
  n_tx: number
  total_received: number
  total_sent: number
  final_balance: number
  txs: BitcoinTransaction[]
}

// GraphQL types
export interface EnergyConsumption {
  transactionHash: string
  energyKwh: number
  sizeBytes: number
  timestamp: number
  blockHash: string
}

export interface DailyEnergyConsumption {
  date: string
  totalEnergyKwh: number
  transactionCount: number
  blockCount: number
}

export interface BlockEnergyData {
  blockHash: string
  height: number
  timestamp: number
  totalEnergyKwh: number
  transactionCount: number
  transactions: EnergyConsumption[]
}

export interface WalletEnergyData {
  address: string
  totalEnergyKwh: number
  transactionCount: number
  transactions: EnergyConsumption[]
}
