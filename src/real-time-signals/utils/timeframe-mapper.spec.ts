import { TimeframeMapper } from './timeframe-mapper';
import { Timeframe } from '../enums/timeframe.enum';
import { KlineIntervalV3 } from 'bybit-api';

describe('TimeframeMapper', () => {
  describe('toBybitInterval', () => {
    it('should map TF1M to 1 minute interval', () => {
      // Act
      const result = TimeframeMapper.toBybitInterval(Timeframe.TF1M);

      // Assert
      expect(result).toBe('1');
    });

    it('should map TF5M to 5 minute interval', () => {
      // Act
      const result = TimeframeMapper.toBybitInterval(Timeframe.TF5M);

      // Assert
      expect(result).toBe('5');
    });

    it('should map TF15M to 15 minute interval', () => {
      // Act
      const result = TimeframeMapper.toBybitInterval(Timeframe.TF15M);

      // Assert
      expect(result).toBe('15');
    });

    it('should map TF1H to 60 minute interval', () => {
      // Act
      const result = TimeframeMapper.toBybitInterval(Timeframe.TF1H);

      // Assert
      expect(result).toBe('60');
    });

    it('should map TF4H to 240 minute interval', () => {
      // Act
      const result = TimeframeMapper.toBybitInterval(Timeframe.TF4H);

      // Assert
      expect(result).toBe('240');
    });

    it('should throw error for unknown timeframe', () => {
      // Act & Assert
      expect(() => {
        TimeframeMapper.toBybitInterval('unknown' as Timeframe);
      }).toThrow(
        'Unsupported timeframe: unknown. Supported timeframes are: tf1m, tf5m, tf15m, tf1h, tf4h',
      );
    });
  });

  describe('getTimeframeDescription', () => {
    it('should return correct description for TF1M', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription(Timeframe.TF1M);

      // Assert
      expect(result).toBe('1 minute');
    });

    it('should return correct description for TF5M', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription(Timeframe.TF5M);

      // Assert
      expect(result).toBe('5 minutes');
    });

    it('should return correct description for TF15M', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription(Timeframe.TF15M);

      // Assert
      expect(result).toBe('15 minutes');
    });

    it('should return correct description for TF1H', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription(Timeframe.TF1H);

      // Assert
      expect(result).toBe('1 hour');
    });

    it('should return correct description for TF4H', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription(Timeframe.TF4H);

      // Assert
      expect(result).toBe('4 hours');
    });

    it('should return unknown for invalid timeframe', () => {
      // Act
      const result = TimeframeMapper.getTimeframeDescription('invalid' as Timeframe);

      // Assert
      expect(result).toBe('unknown');
    });
  });

  describe('isValidTimeframe', () => {
    it('should return true for valid timeframes', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe(Timeframe.TF1M)).toBe(true);
      expect(TimeframeMapper.isValidTimeframe(Timeframe.TF5M)).toBe(true);
      expect(TimeframeMapper.isValidTimeframe(Timeframe.TF15M)).toBe(true);
      expect(TimeframeMapper.isValidTimeframe(Timeframe.TF1H)).toBe(true);
      expect(TimeframeMapper.isValidTimeframe(Timeframe.TF4H)).toBe(true);
    });

    it('should return false for invalid timeframes', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe('invalid')).toBe(false);
      expect(TimeframeMapper.isValidTimeframe('tf1s')).toBe(false);
      expect(TimeframeMapper.isValidTimeframe('tf10s')).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should map all timeframes to valid Bybit intervals', () => {
      // Arrange
      const allTimeframes = Object.values(Timeframe);

      // Act & Assert
      allTimeframes.forEach((timeframe) => {
        const interval = TimeframeMapper.toBybitInterval(timeframe);
        expect(['1', '5', '15', '60', '240']).toContain(interval);
      });
    });

    it('should provide descriptions for all timeframes', () => {
      // Arrange
      const allTimeframes = Object.values(Timeframe);

      // Act & Assert
      allTimeframes.forEach((timeframe) => {
        const description = TimeframeMapper.getTimeframeDescription(timeframe);
        expect(description).not.toBe('unknown');
        expect(description).toMatch(/minute|hour/);
      });
    });

    it('should validate all enum values', () => {
      // Arrange
      const allTimeframes = Object.values(Timeframe);

      // Act & Assert
      allTimeframes.forEach((timeframe) => {
        expect(TimeframeMapper.isValidTimeframe(timeframe)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe('')).toBe(false);
    });

    it('should handle null and undefined', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe(null as any)).toBe(false);
      expect(TimeframeMapper.isValidTimeframe(undefined as any)).toBe(false);
    });

    it('should handle numbers', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe(123 as any)).toBe(false);
    });

    it('should handle objects', () => {
      // Act & Assert
      expect(TimeframeMapper.isValidTimeframe({} as any)).toBe(false);
    });
  });
});
