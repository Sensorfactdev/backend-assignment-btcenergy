import { getBlockWithEnergy, getDailyEnergy } from './blockEnergy'
import { getBlock, getBlocksForDay } from './blockchainApi'
import { KWH_PER_BYTE } from './energy'
import type { RawBlock, RawBlockSummary } from '../types/blockchain'

jest.mock('./blockchainApi')

const mockGetBlock = getBlock as jest.MockedFunction<typeof getBlock>
const mockGetBlocksForDay = getBlocksForDay as jest.MockedFunction<typeof getBlocksForDay>

afterEach(() => {
  jest.resetAllMocks()
})

describe('getBlockWithEnergy', () => {
  it('computes per-transaction and total energy for a block', async () => {
    const block: RawBlock = {
      hash: 'block-1',
      height: 100,
      time: 123,
      tx: [
        { txId: 'tx-1', size: 200 },
        { txId: 'tx-2', size: 300 },
      ],
    }
    mockGetBlock.mockResolvedValue(block)

    const result = await getBlockWithEnergy('block-1')

    expect(mockGetBlock).toHaveBeenCalledWith('block-1')
    expect(result.hash).toBe('block-1')
    expect(result.transactions).toEqual([
      { txId: 'tx-1', size: 200, energyConsumptionKwh: 200 * KWH_PER_BYTE },
      { txId: 'tx-2', size: 300, energyConsumptionKwh: 300 * KWH_PER_BYTE },
    ])
    expect(result.totalEnergyConsumptionKwh).toBeCloseTo(500 * KWH_PER_BYTE)
  })
})

describe('getDailyEnergy', () => {
  const summaries: RawBlockSummary[] = [
    { hash: 'b1', height: 1, time: 1 },
    { hash: 'b2', height: 2, time: 2 },
    { hash: 'b3', height: 3, time: 3 },
  ]

  const blocksByHash: Record<string, RawBlock> = {
    b1: { hash: 'b1', height: 1, time: 1, tx: [{ txId: 't1', size: 100 }] },
    b2: { hash: 'b2', height: 2, time: 2, tx: [{ txId: 't2', size: 200 }] },
    b3: { hash: 'b3', height: 3, time: 3, tx: [{ txId: 't3', size: 300 }] },
  }

  beforeEach(() => {
    mockGetBlocksForDay.mockResolvedValue(summaries)
    mockGetBlock.mockImplementation(async (hash: string) => blocksByHash[hash])
  })

  it('sums energy across every block for each requested day', async () => {
    const results = await getDailyEnergy(2)

    expect(results).toHaveLength(2)
    expect(mockGetBlocksForDay).toHaveBeenCalledTimes(2)
    for (const day of results) {
      expect(day.blockCount).toBe(3)
      expect(day.totalEnergyConsumptionKwh).toBeCloseTo((100 + 200 + 300) * KWH_PER_BYTE)
    }
  })

  it('truncates to maxBlocksPerDay when provided (dev/demo escape hatch)', async () => {
    const results = await getDailyEnergy(1, 2)

    expect(mockGetBlock).toHaveBeenCalledTimes(2)
    expect(mockGetBlock).toHaveBeenCalledWith('b1')
    expect(mockGetBlock).toHaveBeenCalledWith('b2')
    expect(mockGetBlock).not.toHaveBeenCalledWith('b3')

    expect(results[0].blockCount).toBe(2)
    expect(results[0].totalEnergyConsumptionKwh).toBeCloseTo((100 + 200) * KWH_PER_BYTE)
  })
})
