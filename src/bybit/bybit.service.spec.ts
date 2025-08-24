import { Test, TestingModule } from '@nestjs/testing';
import { BybitService } from './bybit.service';
import { RestClientV5 } from 'bybit-api';

// Mock the bybit-api RestClientV5
jest.mock('bybit-api', () => ({
  RestClientV5: jest.fn().mockImplementation(() => ({
    getTickers: jest.fn(),
    getKline: jest.fn(),
  })),
}));

describe('BybitService', () => {
  let service: BybitService;
  let mockRestClient: jest.Mocked<RestClientV5>;

  beforeEach(async () => {
    // Mock environment variables for testing
    process.env.BYBIT_API_KEY = 'test-api-key';
    process.env.BYBIT_API_SECRET = 'test-api-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [BybitService],
    }).compile();

    service = module.get<BybitService>(BybitService);
    mockRestClient = (service as any).client;
  });

  afterEach(() => {
    // Clean up environment variables after each test
    delete process.env.BYBIT_API_KEY;
    delete process.env.BYBIT_API_SECRET;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTickers', () => {
    it('should return tickers list', async () => {
      const mockResponse = {
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              lastPrice: '65000',
              indexPrice: '64900',
              markPrice: '64980',
              prevPrice24h: '63000',
              price24hPcnt: '0.0317',
              prevPrice1h: '64500',
              highPrice24h: '65500',
              lowPrice24h: '62000',
              volume24h: '1234',
              turnover24h: '78900000',
              openInterest: '300',
              openInterestValue: '1500000',
              fundingRate: '0.01',
              nextFundingTime: '1234567890',
              bid1Price: '64950',
              bid1Size: '50',
              ask1Price: '65000',
              ask1Size: '60',
              predictedDeliveryPrice: '64800',
              basisRate: '0.001',
              deliveryFeeRate: '0.0005',
              deliveryTime: '1234569999',
              basis: '100',
              preOpenPrice: '64000',
              preQty: '200',
              curPreListingPhase: 'Live',
            },
          ],
        },
      };

      mockRestClient.getTickers.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getTickers();

      expect(result).toEqual([
        {
          symbol: 'BTCUSDT',
          lastPrice: 65000,
          indexPrice: 64900,
          markPrice: 64980,
          prevPrice24h: 63000,
          price24hPcnt: 0.0317,
          prevPrice1h: 64500,
          highPrice24h: 65500,
          lowPrice24h: 62000,
          volume24h: 1234,
          turnover24h: 78900000,
          openInterest: 300,
          openInterestValue: 1500000,
          fundingRate: 0.01,
          nextFundingTime: '1234567890',
          bid1Price: 64950,
          bid1Size: 50,
          ask1Price: 65000,
          ask1Size: 60,
          predictedDeliveryPrice: 64800,
          basisRate: 0.001,
          deliveryFeeRate: 0.0005,
          deliveryTime: '1234569999',
          basis: 100,
          preOpenPrice: 64000,
          preQty: 200,
          curPreListingPhase: 'Live',
        },
      ]);

      expect(mockRestClient.getTickers).toHaveBeenCalledWith({
        category: 'linear',
      });
    });

    it('should return only the ticker matching the given symbol', async () => {
      const mockResponse = {
        retCode: 0,
        result: {
          list: [
            { symbol: 'BTCUSDT', lastPrice: '65000', price24hPcnt: '0.04', volume24h: '1234' },
            { symbol: 'ETHUSDT', lastPrice: '3500', price24hPcnt: '0.02', volume24h: '5678' },
          ],
        },
      };

      mockRestClient.getTickers.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getTickers(['ETHUSDT']);

      expect(result).toEqual([
        {
          symbol: 'ETHUSDT',
          lastPrice: 3500,
          indexPrice: NaN,
          markPrice: NaN,
          prevPrice24h: NaN,
          price24hPcnt: 0.02,
          prevPrice1h: NaN,
          highPrice24h: NaN,
          lowPrice24h: NaN,
          volume24h: 5678,
          turnover24h: NaN,
          openInterest: NaN,
          openInterestValue: NaN,
          fundingRate: NaN,
          nextFundingTime: undefined,
          bid1Price: NaN,
          bid1Size: NaN,
          ask1Price: NaN,
          ask1Size: NaN,
          predictedDeliveryPrice: NaN,
          basisRate: NaN,
          deliveryFeeRate: NaN,
          deliveryTime: undefined,
          basis: NaN,
          preOpenPrice: NaN,
          preQty: NaN,
          curPreListingPhase: undefined,
        },
      ]);
    });
  });

  describe('getCandles', () => {
    it('should return candle data for symbol and interval', async () => {
      const mockCandle = {
        retCode: 0,
        result: {
          list: [['1704067200000', '65000', '65500', '64800', '65200', '1234', '78900000']],
        },
      };

      mockRestClient.getKline.mockResolvedValueOnce(mockCandle as any);

      const result = await service.getCandles('BTCUSDT', '1');
      expect(result).toEqual([
        {
          openTime: '1704067200000',
          open: '65000',
          high: '65500',
          low: '64800',
          close: '65200',
          volume: '1234',
          turnover: '78900000',
        },
      ]);
      expect(mockRestClient.getKline).toHaveBeenCalledWith({
        category: 'linear',
        symbol: 'BTCUSDT',
        interval: '1',
        limit: 100,
      });
    });
  });
});
