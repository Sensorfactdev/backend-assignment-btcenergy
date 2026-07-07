import type { RawBlock } from '../types/blockchain'

export const KWH_PER_BYTE = 4.56

export function transactionEnergyKwh(sizeBytes: number): number {
  return sizeBytes * KWH_PER_BYTE
}

export function blockEnergyKwh(block: RawBlock): number {
  return block.tx.reduce((total, tx) => total + transactionEnergyKwh(tx.size), 0)
}
