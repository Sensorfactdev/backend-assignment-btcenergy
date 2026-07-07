export interface RawBlockTransaction {
  txId: string
  size: number
}

export interface RawBlock {
  hash: string
  height: number
  time: number
  tx: RawBlockTransaction[]
}

export interface RawBlockSummary {
  hash: string
  height: number
  time: number
}

export interface RawAddressPage {
  address: string
  totalTxCount: number
  transactions: RawBlockTransaction[]
}
