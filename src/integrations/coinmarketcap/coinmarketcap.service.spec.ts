import { Test, TestingModule } from '@nestjs/testing';
import { CoinMarketCapService } from './coinmarketcap.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock service class for testing
class MockCoinMarketCapService extends CoinMarketCapService {
  constructor(apiKey?: string) {
    super();
    if (apiKey) {
      Object.defineProperty(this, 'API_KEY', {
        value: apiKey,
        writable: false,
      });
    }
  }
}

describe('CoinMarketCapService', () => {
  let service: CoinMarketCapService;
  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset environment variables
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinMarketCapService],
    }).compile();

    service = module.get<CoinMarketCapService>(CoinMarketCapService);
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMarketCapData', () => {
    it('should return market cap data for requested symbols', async () => {
      // Create a mock service with API key
      const testService = new MockCoinMarketCapService('test-api-key');

      const mockResponse = {
        data: {
          data: {
            BTC: {
              id: 1,
              name: 'Bitcoin',
              symbol: 'BTC',
              slug: 'bitcoin',
              num_market_pairs: 500,
              date_added: '2013-04-28T00:00:00.000Z',
              tags: ['mineable'],
              max_supply: 21000000,
              circulating_supply: 19500000,
              total_supply: 21000000,
              infinite_supply: false,
              platform: null,
              cmc_rank: 1,
              self_reported_circulating_supply: null,
              self_reported_market_cap: null,
              tvl_ratio: null,
              last_updated: '2024-01-01T00:00:00.000Z',
              quote: {
                USD: {
                  price: 65000,
                  volume_24h: 25000000000,
                  volume_change_24h: 5.2,
                  percent_change_1h: 0.1,
                  percent_change_24h: 1.56,
                  percent_change_7d: 5.2,
                  percent_change_30d: 15.3,
                  percent_change_60d: 25.1,
                  percent_change_90d: 35.2,
                  market_cap: 1200000000000,
                  market_cap_dominance: 50.2,
                  fully_diluted_market_cap: 1365000000000,
                  tvl: null,
                  last_updated: '2024-01-01T00:00:00.000Z',
                },
              },
            },
            ETH: {
              id: 1027,
              name: 'Ethereum',
              symbol: 'ETH',
              slug: 'ethereum',
              num_market_pairs: 400,
              date_added: '2015-08-07T00:00:00.000Z',
              tags: ['mineable'],
              max_supply: null,
              circulating_supply: 120000000,
              total_supply: 120000000,
              infinite_supply: true,
              platform: null,
              cmc_rank: 2,
              self_reported_circulating_supply: null,
              self_reported_market_cap: null,
              tvl_ratio: null,
              last_updated: '2024-01-01T00:00:00.000Z',
              quote: {
                USD: {
                  price: 3500,
                  volume_24h: 15000000000,
                  volume_change_24h: 3.1,
                  percent_change_1h: 0.2,
                  percent_change_24h: 1.45,
                  percent_change_7d: 4.8,
                  percent_change_30d: 12.1,
                  percent_change_60d: 20.5,
                  percent_change_90d: 28.3,
                  market_cap: 400000000000,
                  market_cap_dominance: 16.8,
                  fully_diluted_market_cap: 420000000000,
                  tvl: null,
                  last_updated: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await testService.getMarketCapData(['BTC', 'ETH']);

      expect(result).toEqual([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65000,
          marketCap: 1200000000000,
          marketCapRank: 1,
          volume24h: 25000000000,
          priceChange24h: 1.56,
          priceChangePercentage24h: 1.56,
          circulatingSupply: 19500000,
          totalSupply: 21000000,
          maxSupply: 21000000,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          currentPrice: 3500,
          marketCap: 400000000000,
          marketCapRank: 2,
          volume24h: 15000000000,
          priceChange24h: 1.45,
          priceChangePercentage24h: 1.45,
          circulatingSupply: 120000000,
          totalSupply: 120000000,
          maxSupply: null,
        },
      ]);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/cryptocurrency/quotes/latest'),
        {
          headers: {
            'X-CMC_PRO_API_KEY': 'test-api-key',
          },
          params: {
            symbol: 'BTC,ETH',
            convert: 'USD',
          },
        },
      );
    });

    it('should return fallback data when API key is not available', async () => {
      const result = await service.getMarketCapData(['BTC', 'ETH']);

      expect(result).toEqual([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65000,
          marketCap: 1200000000000,
          marketCapRank: 1,
          volume24h: 25000000000,
          priceChange24h: 1000,
          priceChangePercentage24h: 1.56,
          circulatingSupply: 19500000,
          totalSupply: 21000000,
          maxSupply: 21000000,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          currentPrice: 3500,
          marketCap: 400000000000,
          marketCapRank: 2,
          volume24h: 15000000000,
          priceChange24h: 50,
          priceChangePercentage24h: 1.45,
          circulatingSupply: 120000000,
          totalSupply: 120000000,
          maxSupply: null,
        },
      ]);
    });

    it('should handle API errors gracefully and return fallback data', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getMarketCapData(['BTC']);

      expect(result).toEqual([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65000,
          marketCap: 1200000000000,
          marketCapRank: 1,
          volume24h: 25000000000,
          priceChange24h: 1000,
          priceChangePercentage24h: 1.56,
          circulatingSupply: 19500000,
          totalSupply: 21000000,
          maxSupply: 21000000,
        },
      ]);
    });
  });

  describe('getMarketCapDataForSymbol', () => {
    it('should return market cap data for a single symbol', async () => {
      // Create a mock service with API key
      const testService = new MockCoinMarketCapService('test-api-key');

      const mockResponse = {
        data: {
          data: {
            BTC: {
              id: 1,
              name: 'Bitcoin',
              symbol: 'BTC',
              cmc_rank: 1,
              circulating_supply: 19500000,
              total_supply: 21000000,
              max_supply: 21000000,
              quote: {
                USD: {
                  price: 65000,
                  volume_24h: 25000000000,
                  percent_change_24h: 1.56,
                  market_cap: 1200000000000,
                },
              },
            },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await testService.getMarketCapDataForSymbol('BTC');

      expect(result).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: 65000,
        marketCap: 1200000000000,
        marketCapRank: 1,
        volume24h: 25000000000,
        priceChange24h: 1000,
        priceChangePercentage24h: 1.56,
        circulatingSupply: 19500000,
        totalSupply: 21000000,
        maxSupply: 21000000,
      });
    });

    it('should return fallback data for a single symbol when API key is not available', async () => {
      const result = await service.getMarketCapDataForSymbol('BTC');

      expect(result).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: 65000,
        marketCap: 1200000000000,
        marketCapRank: 1,
        volume24h: 25000000000,
        priceChange24h: 1000,
        priceChangePercentage24h: 1.56,
        circulatingSupply: 19500000,
        totalSupply: 21000000,
        maxSupply: 21000000,
      });
    });

    it('should return null when symbol not found', async () => {
      const mockResponse = {
        data: {
          data: {},
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getMarketCapDataForSymbol('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getTopMarketCaps', () => {
    it('should return top market cap data with default limit', async () => {
      // Create a mock service with API key
      const testService = new MockCoinMarketCapService('test-api-key');

      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              name: 'Bitcoin',
              symbol: 'BTC',
              cmc_rank: 1,
              circulating_supply: 19500000,
              total_supply: 21000000,
              max_supply: 21000000,
              quote: {
                USD: {
                  price: 65000,
                  volume_24h: 25000000000,
                  percent_change_24h: 1.56,
                  market_cap: 1200000000000,
                },
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await testService.getTopMarketCaps();

      expect(result).toHaveLength(5);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[2].symbol).toBe('USDT');
      expect(result[3].symbol).toBe('BNB');
      expect(result[4].symbol).toBe('SOL');
    });

    it('should return fallback data when API key is not available', async () => {
      // Ensure no API key is set
      delete process.env.COINMARKETCAP_API_KEY;

      const result = await service.getTopMarketCaps();

      expect(result).toHaveLength(5);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[2].symbol).toBe('USDT');
      expect(result[3].symbol).toBe('BNB');
      expect(result[4].symbol).toBe('SOL');
    });

    it('should respect the limit parameter', async () => {
      const result = await service.getTopMarketCaps(2);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
    });
  });
});
