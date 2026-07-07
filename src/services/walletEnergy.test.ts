import { getWalletEnergy } from './walletEnergy'
import { getAddressTransactionsPage } from './blockchainApi'
import { KWH_PER_BYTE } from './energy'

jest.mock('./blockchainApi')

const mockGetPage = getAddressTransactionsPage as jest.MockedFunction<typeof getAddressTransactionsPage>

afterEach(() => {
  jest.resetAllMocks()
})

describe('getWalletEnergy', () => {
  it('sums a quiet address in a single page', async () => {
    mockGetPage.mockResolvedValue({
      address: 'addr',
      totalTxCount: 2,
      transactions: [
        { txId: 't1', size: 100 },
        { txId: 't2', size: 200 },
      ],
    })

    const result = await getWalletEnergy('addr')

    expect(mockGetPage).toHaveBeenCalledTimes(1)
    expect(mockGetPage).toHaveBeenCalledWith('addr', 5000, 0)
    expect(result.transactionCount).toBe(2)
    expect(result.totalEnergyConsumptionKwh).toBeCloseTo(300 * KWH_PER_BYTE)
  })

  it('paginates across multiple pages until totalTxCount is covered', async () => {
    mockGetPage
      .mockResolvedValueOnce({
        address: 'addr',
        totalTxCount: 10001, // forces 3 iterations at PAGE_SIZE=5000 (offsets 0, 5000, 10000)
        transactions: [
          { txId: 't1', size: 100 },
          { txId: 't2', size: 200 },
        ],
      })
      .mockResolvedValueOnce({
        address: 'addr',
        totalTxCount: 10001,
        transactions: [{ txId: 't3', size: 300 }],
      })
      .mockResolvedValueOnce({
        address: 'addr',
        totalTxCount: 10001,
        transactions: [], // empty page short-circuits the loop
      })

    const result = await getWalletEnergy('addr')

    expect(mockGetPage).toHaveBeenCalledTimes(3)
    expect(mockGetPage).toHaveBeenNthCalledWith(1, 'addr', 5000, 0)
    expect(mockGetPage).toHaveBeenNthCalledWith(2, 'addr', 5000, 5000)
    expect(mockGetPage).toHaveBeenNthCalledWith(3, 'addr', 5000, 10000)
    expect(result.transactionCount).toBe(3)
    expect(result.totalEnergyConsumptionKwh).toBeCloseTo(600 * KWH_PER_BYTE)
  })

  it('stops early and truncates once maxTransactions is reached (dev/demo escape hatch)', async () => {
    mockGetPage.mockResolvedValue({
      address: 'addr',
      totalTxCount: 10001,
      transactions: [
        { txId: 't1', size: 100 },
        { txId: 't2', size: 200 },
        { txId: 't3', size: 300 },
      ],
    })

    const result = await getWalletEnergy('addr', 2)

    expect(mockGetPage).toHaveBeenCalledTimes(1)
    expect(result.transactionCount).toBe(2)
    expect(result.totalEnergyConsumptionKwh).toBeCloseTo(300 * KWH_PER_BYTE)
  })
})
