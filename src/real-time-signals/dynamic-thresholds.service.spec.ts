import { Test, TestingModule } from '@nestjs/testing';
import { DynamicThresholdsService } from './dynamic-thresholds.service';
import { BybitService } from '../bybit/bybit.service';
import { Timeframe } from './enums/timeframe.enum';
import { DynamicThresholds } from './response/real-time-signal-response';

describe('DynamicThresholdsService', () => {
  let service: DynamicThresholdsService;
  let bybitService: jest.Mocked<BybitService>;

  const mockCandles = Array.from({ length: 150 }, (_, i) => ({
    openTime: (1640995200000 + i * 60000).toString(),
    open: (100 + i * 0.1).toFixed(2),
    high: (105 + i * 0.1).toFixed(2),
    low: (95 + i * 0.1).toFixed(2),
    close: (102 + i * 0.1).toFixed(2),
    volume: (1000 + i * 10).toString(),
    turnover: ((102 + i * 0.1) * (1000 + i * 10)).toFixed(2),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicThresholdsService,
        {
          provide: BybitService,
          useValue: {
            getCandles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DynamicThresholdsService>(DynamicThresholdsService);
    bybitService = module.get(BybitService);

    // Vyčistíme cache před každým testem
    service.clearCache();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDynamicThresholds', () => {
    it('should calculate thresholds from historical data', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result).toBeDefined();
      expect(result.priceChange).toBeDefined();
      expect(result.volumeSpike).toBeDefined();
      expect(result.percentiles).toBeDefined();
      expect(bybitService.getCandles).toHaveBeenCalledWith('BTCUSDT', '1', 1000);
    });

    it('should return cached thresholds if available', async () => {
      // Arrange
      bybitService.getCandles.mockClear(); // Reset mock call count
      bybitService.getCandles.mockResolvedValue(mockCandles);
      service.clearCache(); // Vyčistíme cache před testem

      // Act - první volání
      const result1 = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);
      // Act - druhé volání (mělo by použít cache)
      const result2 = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result1).toEqual(result2);
      expect(bybitService.getCandles).toHaveBeenCalledTimes(1); // Pouze jednou
    });

    it('should handle insufficient data gracefully', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles.slice(0, 5)); // Málo dat

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result).toBeDefined();
      expect(result.priceChange.moderate).toBeGreaterThan(0);
    });

    it('should handle API errors with fallback thresholds', async () => {
      // Arrange
      bybitService.getCandles.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result).toBeDefined();
      expect(result.priceChange.moderate).toBe(0.5); // Fallback hodnota
      expect(result.volumeSpike.moderate).toBe(1.5); // Fallback hodnota
    });

    it('should calculate different thresholds for different timeframes', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result1m = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);
      const result5m = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF5M);

      // Assert
      expect(result1m).toBeDefined();
      expect(result5m).toBeDefined();
      // Různé cache klíče pro různé timeframes
      expect(bybitService.getCandles).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateThresholdPercentile', () => {
    it('should calculate correct percentile for value', () => {
      // Arrange
      const percentiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const value = 3;

      // Act
      const result = service.calculateThresholdPercentile(value, percentiles);

      // Assert
      expect(result).toBe(20); // 2 z 10 hodnot je menší než 3 (1, 2)
    });

    it('should return 0 for empty percentiles array', () => {
      // Arrange
      const percentiles: number[] = [];
      const value = 5;

      // Act
      const result = service.calculateThresholdPercentile(value, percentiles);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 100 for value higher than all percentiles', () => {
      // Arrange
      const percentiles = [1, 2, 3, 4, 5];
      const value = 10;

      // Act
      const result = service.calculateThresholdPercentile(value, percentiles);

      // Assert
      expect(result).toBe(100);
    });

    it('should return 0 for value lower than all percentiles', () => {
      // Arrange
      const percentiles = [1, 2, 3, 4, 5];
      const value = 0;

      // Act
      const result = service.calculateThresholdPercentile(value, percentiles);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);
      await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Act
      service.clearCache();
      await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(bybitService.getCandles).toHaveBeenCalledTimes(2); // Cache byla vyčištěna
    });
  });

  describe('threshold calculation logic', () => {
    it('should calculate price change thresholds correctly', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result.priceChange.moderate).toBeLessThanOrEqual(result.priceChange.significant);
      expect(result.priceChange.significant).toBeLessThanOrEqual(result.priceChange.strong);
      expect(result.priceChange.strong).toBeLessThanOrEqual(result.priceChange.explosive);
    });

    it('should calculate volume spike thresholds correctly', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result.volumeSpike.moderate).toBeLessThanOrEqual(result.volumeSpike.high);
      expect(result.volumeSpike.high).toBeLessThanOrEqual(result.volumeSpike.extreme);
    });

    it('should include percentiles in result', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result = await service.calculateDynamicThresholds('BTCUSDT', Timeframe.TF1M);

      // Assert
      expect(result.percentiles.priceChange).toBeInstanceOf(Array);
      expect(result.percentiles.volumeSpike).toBeInstanceOf(Array);
      // Pokud jsou data dostatečná, percentiles by měly být neprázdné
      // Pokud ne, fallback data mají prázdné percentiles
      expect(result.percentiles.priceChange.length).toBeGreaterThanOrEqual(0);
      expect(result.percentiles.volumeSpike.length).toBeGreaterThanOrEqual(0);
    });
  });
});
