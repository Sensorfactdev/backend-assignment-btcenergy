import { blockEnergyKwh, KWH_PER_BYTE, transactionEnergyKwh } from './energy'
import type { RawBlock } from '../types/blockchain'

describe('transactionEnergyKwh', () => {
  it('multiplies size in bytes by the per-byte energy cost', () => {
    expect(transactionEnergyKwh(100)).toBe(100 * KWH_PER_BYTE)
    expect(transactionEnergyKwh(0)).toBe(0)
  })
})

describe('blockEnergyKwh', () => {
  it('sums each transaction\'s energy cost', () => {
    const block: RawBlock = {
      hash: 'block-hash',
      height: 1,
      time: 0,
      tx: [
        { txId: 'a', size: 100 },
        { txId: 'b', size: 250 },
      ],
    }

    expect(blockEnergyKwh(block)).toBeCloseTo(100 * KWH_PER_BYTE + 250 * KWH_PER_BYTE)
  })

  it('returns 0 for a block with no transactions', () => {
    const block: RawBlock = { hash: 'empty', height: 1, time: 0, tx: [] }
    expect(blockEnergyKwh(block)).toBe(0)
  })
})
