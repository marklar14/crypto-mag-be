import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeSignalsService } from './real-time-signals.service';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';
import { DynamicThresholdsService } from './dynamic-thresholds.service';
import { TickAnalysisService } from './tick-analysis.service';
import { Timeframe } from './enums/timeframe.enum';
import { SignalType, SignalStrength } from './types/signal-types';
import { RealTimeSignalResponse } from './response/real-time-signal-response';

describe('RealTimeSignalsService', () => {
  let service: RealTimeSignalsService;
  let bybitService: jest.Mocked<BybitService>;
  let bybitInstrumentsService: jest.Mocked<BybitInstrumentsService>;
  let dynamicThresholdsService: jest.Mocked<DynamicThresholdsService>;
  let tickAnalysisService: jest.Mocked<TickAnalysisService>;

  const mockTicker = {
    symbol: 'BTCUSDT',
    lastPrice: 55000, // Výrazná změna ceny - 10% nárůst
    indexPrice: 55000,
    markPrice: 55000,
    prevPrice24h: 49500,
    price24hPcnt: 11.11, // 11% změna
    prevPrice1h: 50000, // Výrazná změna za 1h - 10% nárůst
    highPrice24h: 56000,
    lowPrice24h: 49000,
    volume24h: 5000000, // Vysoký volume
    turnover24h: 250000000,
    openInterest: 100000,
    openInterestValue: 5000000000,
    fundingRate: 0.0001,
    nextFundingTime: '2024-01-01T00:00:00Z',
    bid1Price: 54999,
    bid1Size: 100,
    ask1Price: 55001,
    ask1Size: 100,
    predictedDeliveryPrice: 55000,
    basisRate: 0,
    deliveryFeeRate: 0,
    deliveryTime: '2024-01-01T00:00:00Z',
    basis: 0,
    preOpenPrice: 55000,
    preQty: 0,
    curPreListingPhase: '',
  };

  const mockInstrument = {
    symbol: 'BTCUSDT',
    baseCoin: 'BTC',
    quoteCoin: 'USDT',
    status: 'Trading',
  };

  const mockThresholds = {
    priceChange: {
      moderate: 0.5,
      significant: 1.0,
      strong: 2.0,
      explosive: 5.0,
    },
    volumeSpike: {
      moderate: 1.5,
      high: 2.5,
      extreme: 5.0,
    },
    percentiles: {
      priceChange: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
      volumeSpike: [0.5, 1.0, 1.5, 2.0, 3.0, 5.0],
    },
  };

  const mockTickAnalysis = {
    priceMomentum: 0.5,
    volumePressure: 0.7,
    tickFrequency: 0.8,
    largeOrders: 3,
  };

  const mockCandles = Array.from({ length: 100 }, (_, i) => ({
    openTime: new Date(Date.now() - (100 - i) * 60000).toISOString(),
    open: (50000 + i * 100).toString(),
    high: (50000 + i * 100 + 200).toString(),
    low: (50000 + i * 100 - 100).toString(),
    close: (50000 + i * 100 + 150).toString(),
    volume: (2000000 + i * 5000).toString(),
    turnover: (100000000 + i * 100000).toString(),
  }));

  mockCandles[mockCandles.length - 2].close = '50000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealTimeSignalsService,
        {
          provide: BybitService,
          useValue: {
            getTickers: jest.fn(),
            getCandles: jest.fn(),
          },
        },
        {
          provide: BybitInstrumentsService,
          useValue: {
            getInstruments: jest.fn(),
          },
        },
        {
          provide: DynamicThresholdsService,
          useValue: {
            calculateDynamicThresholds: jest.fn(),
            calculateThresholdPercentile: jest.fn(),
          },
        },
        {
          provide: TickAnalysisService,
          useValue: {
            analyzeTickData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RealTimeSignalsService>(RealTimeSignalsService);
    bybitService = module.get(BybitService);
    bybitInstrumentsService = module.get(BybitInstrumentsService);
    dynamicThresholdsService = module.get(DynamicThresholdsService);
    tickAnalysisService = module.get(TickAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRealTimeSignals', () => {
    it('should return real-time signals with default parameters', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 70, 20, true, true);

      // Assert
      expect(result).toBeDefined();
      expect(result.signals).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.scanTime).toBeDefined();
      expect(bybitInstrumentsService.getInstruments).toHaveBeenCalled();
      expect(bybitService.getTickers).toHaveBeenCalled();
    });

    it('should filter signals by threshold', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals(
        [Timeframe.TF1M],
        90, // Vysoký threshold
        20,
        true,
        true,
      );

      // Assert
      expect(result.signals.every((signal) => signal.confidence >= 90)).toBe(true);
    });

    it('should limit results by limit parameter', async () => {
      // Arrange
      const multipleInstruments = Array.from({ length: 10 }, (_, i) => ({
        ...mockInstrument,
        symbol: `COIN${i}USDT`,
      }));

      bybitInstrumentsService.getInstruments.mockResolvedValue(multipleInstruments);
      bybitService.getTickers.mockResolvedValue(
        multipleInstruments.map((inst) => ({ ...mockTicker, symbol: inst.symbol })),
      );
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 50, 5, true, true);

      // Assert
      expect(result.signals.length).toBeLessThanOrEqual(5);
    });

    it('should work without adaptive thresholds', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 70, 20, false, true);

      // Assert
      expect(result).toBeDefined();
      expect(dynamicThresholdsService.calculateDynamicThresholds).not.toHaveBeenCalled();
    });

    it('should work without tick analysis', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 70, 20, true, false);

      // Assert
      expect(result).toBeDefined();
      expect(tickAnalysisService.analyzeTickData).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(
        service.getRealTimeSignals([Timeframe.TF1M], 70, 20, true, true),
      ).rejects.toThrow('API Error');
    });
  });

  describe('signal analysis', () => {
    it('should determine pump signal correctly', async () => {
      // Arrange
      const bullishTicker = {
        ...mockTicker,
        lastPrice: 60000,
        prevPrice1h: 50000,
        volume24h: 10000000,
      }; // 20% nárůst, velký volume
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([bullishTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 50, 20, true, true);

      // Assert
      const pumpSignals = result.signals.filter((s) => s.signalType === 'pump');
      expect(pumpSignals.length).toBeGreaterThan(0);
    });

    it('should determine dump signal correctly', async () => {
      // Arrange
      const bearishTicker = { ...mockTicker, lastPrice: 48000, prevPrice1h: 50000 }; // 4% pokles
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([bearishTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 50, 20, true, true);

      // Assert
      const dumpSignals = result.signals.filter((s) => s.signalType === 'dump');
      expect(dumpSignals.length).toBeGreaterThan(0);
    });

    it('should calculate confidence score correctly', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 50, 20, true, true);

      // Assert
      expect(result.signals.length).toBeGreaterThan(0);
      expect(result.signals[0].confidence).toBeGreaterThanOrEqual(0);
      expect(result.signals[0].confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('metadata calculation', () => {
    it('should calculate metadata correctly', async () => {
      // Arrange
      bybitInstrumentsService.getInstruments.mockResolvedValue([mockInstrument]);
      bybitService.getTickers.mockResolvedValue([mockTicker]);
      bybitService.getCandles.mockResolvedValue(mockCandles);
      dynamicThresholdsService.calculateDynamicThresholds.mockResolvedValue(mockThresholds);
      dynamicThresholdsService.calculateThresholdPercentile.mockReturnValue(85);
      tickAnalysisService.analyzeTickData.mockResolvedValue(mockTickAnalysis);

      // Act
      const result = await service.getRealTimeSignals([Timeframe.TF1M], 50, 20, true, true);

      // Assert
      expect(result.metadata.signalsFound).toBeGreaterThanOrEqual(0);
      expect(result.metadata.totalInstruments).toBeGreaterThanOrEqual(0);
      expect(result.metadata.scanTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.thresholds).toBeDefined();
    });
  });
});
