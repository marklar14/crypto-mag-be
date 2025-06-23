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
              { symbol: 'BTCUSDT', lastPrice: '65000', price24hPcnt: '0.04', volume24h: '1234' },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse as any);

      const result = await service.getTickers();
      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/v5/market/tickers'), {
        params: { category: 'linear' },
      });
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
      expect(result).toEqual(mockCandle.data);
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
