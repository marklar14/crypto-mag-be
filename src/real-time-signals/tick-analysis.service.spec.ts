import { Test, TestingModule } from '@nestjs/testing';
import { TickAnalysisService } from './tick-analysis.service';
import { BybitService } from '../bybit/bybit.service';
import { TickAnalysis } from './response/real-time-signal-response';

describe('TickAnalysisService', () => {
  let service: TickAnalysisService;
  let bybitService: jest.Mocked<BybitService>;

  const mockCandles = [
    {
      openTime: '1640995200000',
      open: '100',
      high: '105',
      low: '95',
      close: '102',
      volume: '1000',
      turnover: '102000',
    },
    {
      openTime: '1640995260000',
      open: '102',
      high: '108',
      low: '100',
      close: '105',
      volume: '1500',
      turnover: '157500',
    },
    {
      openTime: '1640995320000',
      open: '105',
      high: '110',
      low: '102',
      close: '108',
      volume: '2000',
      turnover: '216000',
    },
    {
      openTime: '1640995380000',
      open: '108',
      high: '112',
      low: '105',
      close: '110',
      volume: '1800',
      turnover: '198000',
    },
    {
      openTime: '1640995440000',
      open: '110',
      high: '115',
      low: '108',
      close: '113',
      volume: '2200',
      turnover: '248600',
    },
    {
      openTime: '1640995500000',
      open: '113',
      high: '118',
      low: '110',
      close: '116',
      volume: '2500',
      turnover: '290000',
    },
    {
      openTime: '1640995560000',
      open: '116',
      high: '120',
      low: '113',
      close: '118',
      volume: '3000',
      turnover: '354000',
    },
    {
      openTime: '1640995620000',
      open: '118',
      high: '122',
      low: '115',
      close: '120',
      volume: '2800',
      turnover: '336000',
    },
    {
      openTime: '1640995680000',
      open: '120',
      high: '125',
      low: '118',
      close: '123',
      volume: '3200',
      turnover: '393600',
    },
    {
      openTime: '1640995740000',
      open: '123',
      high: '128',
      low: '120',
      close: '126',
      volume: '3500',
      turnover: '441000',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TickAnalysisService,
        {
          provide: BybitService,
          useValue: {
            getCandles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TickAnalysisService>(TickAnalysisService);
    bybitService = module.get(BybitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeTickData', () => {
    it('should analyze tick data successfully', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result).toBeDefined();
      expect(result.priceMomentum).toBeDefined();
      expect(result.volumePressure).toBeDefined();
      expect(result.tickFrequency).toBeDefined();
      expect(result.largeOrders).toBeDefined();
      expect(bybitService.getCandles).toHaveBeenCalledWith('BTCUSDT', '1', 100);
    });

    it('should return default analysis for insufficient data', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue(mockCandles.slice(0, 5)); // Málo dat

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result).toBeDefined();
      expect(result.priceMomentum).toBe(0);
      expect(result.volumePressure).toBe(0.5); // Neutrální hodnota
      expect(result.tickFrequency).toBe(0);
      expect(result.largeOrders).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      bybitService.getCandles.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result).toBeDefined();
      expect(result.priceMomentum).toBe(0);
      expect(result.volumePressure).toBe(0.5);
      expect(result.tickFrequency).toBe(0);
      expect(result.largeOrders).toBe(0);
    });

    it('should calculate positive price momentum for upward trend', async () => {
      // Arrange
      const upwardCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${100 + i * 2}`,
        high: `${105 + i * 2}`,
        low: `${99 + i * 2}`,
        close: `${102 + i * 2}`,
        volume: `${1000 + i * 100}`,
        turnover: `${102000 + i * 20000}`,
      }));
      bybitService.getCandles.mockResolvedValue(upwardCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.priceMomentum).toBeGreaterThan(0);
    });

    it('should calculate negative price momentum for downward trend', async () => {
      // Arrange
      const downwardCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${110 - i * 0.5}`,
        high: `${112 - i * 0.5}`,
        low: `${108 - i * 0.5}`,
        close: `${109 - i * 0.5}`,
        volume: `${1000 + i * 100}`,
        turnover: `${109000 + i * 20000}`,
      }));
      bybitService.getCandles.mockResolvedValue(downwardCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.priceMomentum).toBeLessThan(0);
    });

    it('should calculate volume pressure correctly', async () => {
      // Arrange
      const mixedCandles = [
        {
          openTime: '1',
          open: '100',
          high: '105',
          low: '99',
          close: '102',
          volume: '1000',
          turnover: '102000',
        }, // Up
        {
          openTime: '2',
          open: '102',
          high: '103',
          low: '98',
          close: '99',
          volume: '1200',
          turnover: '118800',
        }, // Down
        {
          openTime: '3',
          open: '99',
          high: '104',
          low: '98',
          close: '103',
          volume: '1400',
          turnover: '144200',
        }, // Up
        {
          openTime: '4',
          open: '103',
          high: '104',
          low: '97',
          close: '98',
          volume: '1600',
          turnover: '156800',
        }, // Down
        {
          openTime: '5',
          open: '98',
          high: '102',
          low: '97',
          close: '101',
          volume: '1800',
          turnover: '181800',
        }, // Up
      ];
      bybitService.getCandles.mockResolvedValue(mixedCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.volumePressure).toBeGreaterThanOrEqual(0);
      expect(result.volumePressure).toBeLessThanOrEqual(1);
    });

    it('should detect large orders correctly', async () => {
      // Arrange
      const candlesWithSpikes = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${100 + i}`,
        high: `${105 + i}`,
        low: `${99 + i}`,
        close: `${102 + i}`,
        volume: i % 5 === 0 ? `${20000 + i * 100}` : `${1000 + i * 100}`, // Výrazný spike každých 5 svíček
        turnover: `${102000 + i * 20000}`,
      }));
      bybitService.getCandles.mockResolvedValue(candlesWithSpikes);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.largeOrders).toBeGreaterThan(0);
    });

    it('should calculate tick frequency based on volume', async () => {
      // Arrange
      const highVolumeCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${100 + i}`,
        high: `${105 + i}`,
        low: `${99 + i}`,
        close: `${102 + i}`,
        volume: `${50000 + i * 5000}`, // Střední volume pro lepší normalizaci
        turnover: `${5100000 + i * 500000}`,
      }));
      bybitService.getCandles.mockResolvedValue(highVolumeCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.tickFrequency).toBeGreaterThan(0);
      expect(result.tickFrequency).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero volume candles', async () => {
      // Arrange
      const zeroVolumeCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: '100',
        high: '100',
        low: '100',
        close: '100',
        volume: '0',
        turnover: '0',
      }));
      bybitService.getCandles.mockResolvedValue(zeroVolumeCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result.volumePressure).toBe(0.5); // Neutrální při zero volume
      expect(result.tickFrequency).toBe(0);
      expect(result.largeOrders).toBe(0);
    });

    it('should handle single candle', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue([mockCandles[0]]);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result).toBeDefined();
      expect(result.priceMomentum).toBe(0); // Nelze vypočítat momentum z jedné svíčky
    });

    it('should handle empty candles array', async () => {
      // Arrange
      bybitService.getCandles.mockResolvedValue([]);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      expect(result).toBeDefined();
      expect(result.priceMomentum).toBe(0);
      expect(result.volumePressure).toBe(0.5);
      expect(result.tickFrequency).toBe(0);
      expect(result.largeOrders).toBe(0);
    });
  });

  describe('calculation accuracy', () => {
    it('should calculate price momentum as average of price changes', async () => {
      // Arrange
      const testCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${100 + i * 2}`,
        high: `${105 + i * 2}`,
        low: `${99 + i * 2}`,
        close: `${102 + i * 2}`,
        volume: `${1000 + i * 100}`,
        turnover: `${102000 + i * 20000}`,
      }));
      bybitService.getCandles.mockResolvedValue(testCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      // Očekávaný momentum: průměr z posledních 5 svíček
      expect(result.priceMomentum).toBeGreaterThan(0);
    });

    it('should normalize tick frequency correctly', async () => {
      // Arrange
      const highVolumeCandles = Array.from({ length: 100 }, (_, i) => ({
        openTime: `${i + 1}`,
        open: `${100 + i}`,
        high: `${105 + i}`,
        low: `${99 + i}`,
        close: `${102 + i}`,
        volume: `${200000 + i * 10000}`, // Vysoký volume pro normalizaci
        turnover: `${20400000 + i * 2000000}`,
      }));
      bybitService.getCandles.mockResolvedValue(highVolumeCandles);

      // Act
      const result = await service.analyzeTickData('BTCUSDT');

      // Assert
      // Průměrný volume by měl být vysoký, takže tickFrequency by měl být > 0
      expect(result.tickFrequency).toBeGreaterThan(0);
    });
  });
});
