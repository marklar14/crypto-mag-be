import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeSignalsController } from './real-time-signals.controller';
import { RealTimeSignalsService } from './real-time-signals.service';
import { Timeframe } from './enums/timeframe.enum';
import { RealTimeSignalResponse } from './response/real-time-signal-response';

describe('RealTimeSignalsController', () => {
  let controller: RealTimeSignalsController;
  let service: jest.Mocked<RealTimeSignalsService>;

  const mockSignalsResponse: RealTimeSignalResponse = {
    signals: [
      {
        symbol: 'BTCUSDT',
        timeframe: Timeframe.TF1M,
        signalType: 'pump',
        confidence: 85,
        priceChange: 2.5,
        volumeChange: 150.0,
        metrics: {
          priceChange: 2.5,
          volumeSpike: 3.2,
          momentum: 0.8,
          volatility: 1.2,
        },
        tickAnalysis: {
          priceMomentum: 0.7,
          volumePressure: 0.8,
          tickFrequency: 0.9,
          largeOrders: 5,
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
    ],
    metadata: {
      scanTime: 1250,
      totalInstruments: 150,
      signalsFound: 1,
      thresholds: {},
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealTimeSignalsController],
      providers: [
        {
          provide: RealTimeSignalsService,
          useValue: {
            getRealTimeSignals: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RealTimeSignalsController>(RealTimeSignalsController);
    service = module.get(RealTimeSignalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRealTimeSignals', () => {
    it('should return real-time signals with default parameters', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [
          Timeframe.TF1M,
          Timeframe.TF5M,
          Timeframe.TF15M,
          Timeframe.TF1H,
          Timeframe.TF4H,
        ],
        threshold: 70,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith(
        [Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M, Timeframe.TF1H, Timeframe.TF4H],
        70,
        20,
        true,
        true,
      );
    });

    it('should return real-time signals with custom parameters', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M, Timeframe.TF5M],
        threshold: 85,
        limit: 10,
        adaptiveThresholds: false,
        tickAnalysis: false,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith(
        [Timeframe.TF1M, Timeframe.TF5M],
        85,
        10,
        false,
        false,
      );
    });

    it('should handle multiple timeframes', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [
          Timeframe.TF1M,
          Timeframe.TF5M,
          Timeframe.TF15M,
          Timeframe.TF1H,
          Timeframe.TF4H,
        ],
        threshold: 75,
        limit: 15,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith(
        [Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M, Timeframe.TF1H, Timeframe.TF4H],
        75,
        15,
        true,
        true,
      );
    });

    it('should handle single timeframe', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M],
        threshold: 90,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith([Timeframe.TF1M], 90, 20, true, true);
    });

    it('should handle tick analysis for 1m timeframe', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M],
        threshold: 70,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith([Timeframe.TF1M], 70, 20, true, true);
    });

    it('should handle multiple timeframes with tick analysis', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M, Timeframe.TF5M],
        threshold: 70,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith(
        [Timeframe.TF1M, Timeframe.TF5M],
        70,
        20,
        true,
        true,
      );
    });

    it('should handle multiple timeframes without tick analysis', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M],
        threshold: 70,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: false,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith(
        [Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M],
        70,
        20,
        true,
        false,
      );
    });

    it('should handle low threshold', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M],
        threshold: 40,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith([Timeframe.TF1M], 40, 20, true, true);
    });

    it('should handle high threshold', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      // Act
      const result = await controller.getRealTimeSignals({
        timeframes: [Timeframe.TF1M],
        threshold: 95,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: true,
      });

      // Assert
      expect(result).toEqual(mockSignalsResponse);
      expect(service.getRealTimeSignals).toHaveBeenCalledWith([Timeframe.TF1M], 95, 20, true, true);
    });
  });

  describe('parameter validation', () => {
    it('should handle different timeframe combinations', async () => {
      // Arrange
      service.getRealTimeSignals.mockResolvedValue(mockSignalsResponse);

      const testCases = [
        { timeframes: [Timeframe.TF1M], description: 'single 1m timeframe' },
        { timeframes: [Timeframe.TF5M, Timeframe.TF15M], description: 'two timeframes' },
        {
          timeframes: [
            Timeframe.TF1M,
            Timeframe.TF5M,
            Timeframe.TF15M,
            Timeframe.TF1H,
            Timeframe.TF4H,
          ],
          description: 'all timeframes',
        },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        const result = await controller.getRealTimeSignals({
          timeframes: testCase.timeframes,
          threshold: 70,
          limit: 20,
          adaptiveThresholds: true,
          tickAnalysis: true,
        });

        expect(result).toEqual(mockSignalsResponse);
        expect(service.getRealTimeSignals).toHaveBeenCalledWith(
          testCase.timeframes,
          70,
          20,
          true,
          true,
        );
      }
    });
  });
});
