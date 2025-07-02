import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoService } from './coingecko.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CoinGeckoService', () => {
  let service: CoinGeckoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinGeckoService],
    }).compile();

    service = module.get<CoinGeckoService>(CoinGeckoService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMarketCapData', () => {
    it('should return market cap data for requested symbols from cache', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
          {
            id: 'ethereum',
            symbol: 'eth',
            name: 'Ethereum',
            current_price: 3500,
            market_cap: 400000000000,
            market_cap_rank: 2,
            total_volume: 15000000000,
            price_change_24h: 50,
            price_change_percentage_24h: 1.45,
            circulating_supply: 120000000,
            total_supply: 120000000,
            max_supply: null,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

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

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/coins/markets'), {
        headers: {},
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          locale: 'en',
        },
      });
    });

    it('should return fallback data when API fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

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

    it('should use cached data for subsequent calls', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      // First call - should fetch from API
      await service.getMarketCapData(['BTC']);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/coins/markets'), {
        headers: {},
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          locale: 'en',
        },
      });

      // Second call - should use cache (no additional API call)
      await service.getMarketCapData(['BTC']);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still only 1 call
    });
  });

  describe('getMarketCapDataForSymbol', () => {
    it('should return market cap data for a single symbol', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

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
        data: [],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getMarketCapDataForSymbol('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getTopMarketCaps', () => {
    it('should return top market cap data with default limit', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
          {
            id: 'ethereum',
            symbol: 'eth',
            name: 'Ethereum',
            current_price: 3500,
            market_cap: 400000000000,
            market_cap_rank: 2,
            total_volume: 15000000000,
            price_change_24h: 50,
            price_change_percentage_24h: 1.45,
            circulating_supply: 120000000,
            total_supply: 120000000,
            max_supply: null,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getTopMarketCaps();

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[0].marketCapRank).toBe(1);
      expect(result[1].marketCapRank).toBe(2);
    });

    it('should return fallback data when API fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getTopMarketCaps(5);

      expect(result).toHaveLength(5);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[2].symbol).toBe('BNB');
      expect(result[3].symbol).toBe('SOL');
      expect(result[4].symbol).toBe('ADA');
    });
  });

  describe('cache management', () => {
    it('should provide cache statistics', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      // Populate cache first
      await service.getMarketCapData(['BTC']);

      const stats = service.getCacheStats();

      expect(stats.cacheSize).toBe(1);
      expect(stats.isStale).toBe(false);
      expect(stats.lastUpdate).toBeInstanceOf(Date);
    });

    it('should force refresh cache', async () => {
      const mockResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            price_change_24h: 1000,
            price_change_percentage_24h: 1.56,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse as any);

      // First call
      await service.getMarketCapData(['BTC']);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Force refresh
      await service.forceRefreshCache();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
