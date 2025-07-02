import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalAnalysisService, CandleData } from './technical-analysis.service';

describe('TechnicalAnalysisService', () => {
  let service: TechnicalAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnicalAnalysisService],
    }).compile();

    service = module.get<TechnicalAnalysisService>(TechnicalAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for uptrend', () => {
      // Create a simple uptrend price series
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
      const rsi = service.calculateRSI(prices);

      expect(rsi).toBeGreaterThan(50);
      expect(rsi).toBeLessThanOrEqual(100); // RSI can be exactly 100 for all gains
    });

    it('should calculate RSI correctly for downtrend', () => {
      // Create a simple downtrend price series
      const prices = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
      const rsi = service.calculateRSI(prices);

      expect(rsi).toBeLessThan(50);
      expect(rsi).toBeGreaterThanOrEqual(0); // RSI can be exactly 0 for all losses
    });

    it('should return 0 for insufficient data', () => {
      const prices = [10, 11, 12, 13];
      const rsi = service.calculateRSI(prices);
      expect(rsi).toBe(0);
    });

    it('should handle extreme values correctly', () => {
      // All gains
      const allGains = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
      const rsiGains = service.calculateRSI(allGains);
      expect(rsiGains).toBeGreaterThan(70);

      // All losses
      const allLosses = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
      const rsiLosses = service.calculateRSI(allLosses);
      expect(rsiLosses).toBeLessThan(30);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.1);
      const macd = service.calculateMACD(prices);

      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('signal');
      expect(macd).toHaveProperty('histogram');
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });

    it('should return zeros for insufficient data', () => {
      const prices = [100, 101, 102, 103, 104, 105];
      const macd = service.calculateMACD(prices);

      expect(macd.macd).toBe(0);
      expect(macd.signal).toBe(0);
      expect(macd.histogram).toBe(0);
    });

    it('should handle uptrend correctly', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const macd = service.calculateMACD(prices);

      expect(macd.macd).toBeGreaterThan(0);
      expect(macd.histogram).toBeGreaterThan(0);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate EMA correctly', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const ema = service.calculateEMA(prices, 5);

      expect(ema).toBeGreaterThan(0);
      expect(ema).toBeLessThan(20);
    });

    it('should return 0 for insufficient data', () => {
      const prices = [10, 11, 12];
      const ema = service.calculateEMA(prices, 5);
      expect(ema).toBe(0);
    });

    it('should handle single price', () => {
      const prices = [100];
      const ema = service.calculateEMA(prices, 1);
      expect(ema).toBe(100);
    });
  });

  describe('calculateADX', () => {
    it('should calculate ADX correctly', () => {
      const highs = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
      ];
      const lows = [95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
      const closes = [97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112];

      const adx = service.calculateADX(highs, lows, closes);

      expect(adx).toBeGreaterThan(0);
      expect(adx).toBeLessThanOrEqual(100); // ADX can be exactly 100
    });

    it('should return 0 for insufficient data', () => {
      const highs = [100, 101, 102];
      const lows = [95, 96, 97];
      const closes = [97, 98, 99];

      const adx = service.calculateADX(highs, lows, closes);
      expect(adx).toBe(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const prices = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
        118, 119, 120,
      ];
      const bb = service.calculateBollingerBands(prices);

      expect(bb).toHaveProperty('upper');
      expect(bb).toHaveProperty('middle');
      expect(bb).toHaveProperty('lower');
      expect(bb).toHaveProperty('width');

      expect(bb.upper).toBeGreaterThan(bb.middle);
      expect(bb.middle).toBeGreaterThan(bb.lower);
      expect(bb.width).toBeGreaterThan(0);
    });

    it('should return zeros for insufficient data', () => {
      const prices = [100, 101, 102];
      const bb = service.calculateBollingerBands(prices);

      expect(bb.upper).toBe(0);
      expect(bb.middle).toBe(0);
      expect(bb.lower).toBe(0);
      expect(bb.width).toBe(0);
    });
  });

  describe('calculateVolumeSpike', () => {
    it('should calculate volume spike correctly', () => {
      const volumes = Array.from({ length: 20 }, () => 1000);
      volumes[19] = 3000; // Spike at the end

      const spike = service.calculateVolumeSpike(volumes);
      // The calculation uses the last 20 periods average, so:
      // Average of first 19 periods: 1000
      // Last period: 3000
      // Expected: 3000 / ((19 * 1000 + 3000) / 20) = 3000 / 1100 = 2.727...
      expect(spike).toBeCloseTo(2.73, 1);
    });

    it('should return 0 for insufficient data', () => {
      const volumes = [1000, 2000, 3000];
      const spike = service.calculateVolumeSpike(volumes);
      expect(spike).toBe(0);
    });

    it('should handle normal volume', () => {
      const volumes = Array.from({ length: 20 }, () => 1000);
      const spike = service.calculateVolumeSpike(volumes);
      expect(spike).toBe(1); // No spike
    });
  });

  describe('isAboveEMA', () => {
    it('should return true when price is above EMA', () => {
      const prices = Array.from({ length: 250 }, (_, i) => 100 + i * 0.1);
      const isAbove = service.isAboveEMA(prices, 200);
      expect(isAbove).toBe(true);
    });

    it('should return false when price is below EMA', () => {
      const prices = Array.from({ length: 250 }, (_, i) => 100 - i * 0.1);
      const isAbove = service.isAboveEMA(prices, 200);
      expect(isAbove).toBe(false);
    });

    it('should return false for insufficient data', () => {
      const prices = [100, 101, 102];
      const isAbove = service.isAboveEMA(prices, 200);
      expect(isAbove).toBe(false);
    });
  });

  describe('detectBreakout', () => {
    it('should detect breakout correctly', () => {
      // Test with simple breakout logic - bypass complex findKeyLevels
      const highs = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
        118, 125,
      ];
      const lows = [
        95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
        114,
      ];
      const closes = [
        97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
        122,
      ];
      const volumes = [
        1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
        1000, 1000, 1000, 1000, 2500,
      ];

      // Mock the findKeyLevels method to return a simple resistance level
      const originalFindKeyLevels = (service as any).findKeyLevels;
      (service as any).findKeyLevels = jest.fn().mockReturnValue({
        resistance: [{ price: 115, strength: 0.8 }],
        support: [],
      });

      const result = service.detectBreakout(highs, lows, closes, volumes);

      // Restore original method
      (service as any).findKeyLevels = originalFindKeyLevels;

      console.log('Breakout result:', result);
      expect(result.isBreakout).toBe(true);
      expect(result.isBreakdown).toBe(false);
    });

    it('should detect breakdown correctly', () => {
      // Test with simple breakdown logic - bypass complex findKeyLevels
      const highs = [
        120, 119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103,
        102, 100,
      ];
      const lows = [
        115, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97,
        95,
      ];
      const closes = [
        114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96,
        90,
      ];
      const volumes = [
        1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
        1000, 1000, 1000, 1000, 2500,
      ];

      // Mock the findKeyLevels method to return a simple support level
      const originalFindKeyLevels = (service as any).findKeyLevels;
      (service as any).findKeyLevels = jest.fn().mockReturnValue({
        resistance: [],
        support: [{ price: 100, strength: 0.8 }],
      });

      const result = service.detectBreakout(highs, lows, closes, volumes);

      // Restore original method
      (service as any).findKeyLevels = originalFindKeyLevels;

      expect(result.isBreakout).toBe(false);
      expect(result.isBreakdown).toBe(true);
    });

    it('should return false for insufficient data', () => {
      const highs = [100, 101, 102];
      const lows = [95, 96, 97];
      const closes = highs.map((h, i) => (h + lows[i]) / 2);
      const volumes = Array(3).fill(1000);

      const result = service.detectBreakout(highs, lows, closes, volumes);
      expect(result.isBreakout).toBe(false);
      expect(result.isBreakdown).toBe(false);
    });

    it('should return false when no breakout/breakdown', () => {
      const highs = Array.from({ length: 20 }, (_, i) => 100 + i);
      const lows = Array.from({ length: 20 }, (_, i) => 95 + i);
      // No extreme values - keep within normal range
      highs[19] = 118; // Within the range of previous highs
      lows[19] = 113; // Within the range of previous lows
      const closes = highs.map((h, i) => (h + lows[i]) / 2);
      const volumes = Array(20).fill(1000);

      const result = service.detectBreakout(highs, lows, closes, volumes);
      expect(result.isBreakout).toBe(false);
      expect(result.isBreakdown).toBe(false);
    });
  });
});
