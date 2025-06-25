import { Test, TestingModule } from '@nestjs/testing';
import { BybitService } from './bybit.service';
import axios from 'axios';

// Mockni axios.get
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BybitService', () => {
  let service: BybitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BybitService],
    }).compile();

    service = module.get<BybitService>(BybitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTickers', () => {
    it('should return tickers list', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

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

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/v5/market/tickers'), {
        params: { category: 'linear' },
      });
    });

    it('should return only the ticker matching the given symbol', async () => {
      const mockResponse = {
        data: {
          result: {
            list: [
              { symbol: 'BTCUSDT', lastPrice: '65000', price24hPcnt: '0.04', volume24h: '1234' },
              { symbol: 'ETHUSDT', lastPrice: '3500', price24hPcnt: '0.02', volume24h: '5678' },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

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
        data: {
          result: {
            list: [['timestamp', 'open', 'high', 'low', 'close', 'volume', 'turnover']],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockCandle as any);

      const result = await service.getCandles('BTCUSDT', '1');
      expect(result).toEqual(mockCandle.data.result.list);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/v5/market/kline'), {
        params: {
          category: 'linear',
          symbol: 'BTCUSDT',
          interval: '1',
          limit: 100,
        },
      });
    });
  });
});
