import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { GetRealTimeSignalsQuery } from './get-real-time-signals-query';
import { Timeframe } from '../enums/timeframe.enum';

describe('GetRealTimeSignalsQuery', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      const queryData = {
        timeframes: [Timeframe.TF1M, Timeframe.TF5M],
        threshold: 75,
        limit: 20,
        adaptiveThresholds: true,
        tickAnalysis: false,
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with default values', async () => {
      // Arrange
      const queryData = {};

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.timeframes).toEqual([
        Timeframe.TF1M,
        Timeframe.TF5M,
        Timeframe.TF15M,
        Timeframe.TF1H,
        Timeframe.TF4H,
      ]);
      expect(query.threshold).toBe(70);
      expect(query.limit).toBe(20);
      expect(query.adaptiveThresholds).toBe(true);
      expect(query.tickAnalysis).toBe(true);
    });

    it('should transform string timeframes to array', async () => {
      // Arrange
      const queryData = {
        timeframes: 'tf1m,tf5m,tf15m',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.timeframes).toEqual([Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M]);
    });

    it('should transform string numbers to numbers', async () => {
      // Arrange
      const queryData = {
        threshold: '75',
        limit: '15',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.threshold).toBe(75);
      expect(query.limit).toBe(15);
    });

    it('should transform string booleans to booleans', async () => {
      // Arrange
      const queryData = {
        adaptiveThresholds: 'true',
        tickAnalysis: 'false',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.adaptiveThresholds).toBe(true);
      expect(query.tickAnalysis).toBe(false);
    });

    it('should fail validation with invalid timeframes', async () => {
      // Arrange
      const queryData = {
        timeframes: ['invalid', Timeframe.TF1M],
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timeframes');
    });

    it('should fail validation with threshold below minimum', async () => {
      // Arrange
      const queryData = {
        threshold: 35, // Pod minimem 40
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('threshold');
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation with threshold above maximum', async () => {
      // Arrange
      const queryData = {
        threshold: 100, // Nad maximem 95
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('threshold');
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation with limit below minimum', async () => {
      // Arrange
      const queryData = {
        limit: 0, // Pod minimem 1
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation with limit above maximum', async () => {
      // Arrange
      const queryData = {
        limit: 150, // Nad maximem 100
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation with non-array timeframes', async () => {
      // Arrange
      const queryData = {
        timeframes: 'not-an-array',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timeframes');
    });

    it('should fail validation with non-number threshold', async () => {
      // Arrange
      const queryData = {
        threshold: 'not-a-number',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('threshold');
    });

    it('should fail validation with non-number limit', async () => {
      // Arrange
      const queryData = {
        limit: 'not-a-number',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('edge cases', () => {
    it('should handle empty timeframes string', async () => {
      // Arrange
      const queryData = {
        timeframes: '',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timeframes');
    });

    it('should handle single timeframe string', async () => {
      // Arrange
      const queryData = {
        timeframes: 'tf1m',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.timeframes).toEqual([Timeframe.TF1M]);
    });

    it('should handle boundary threshold values', async () => {
      // Arrange
      const validThresholds = [40, 70, 95];

      for (const threshold of validThresholds) {
        // Act
        const query = plainToClass(GetRealTimeSignalsQuery, { threshold });
        const errors = await validate(query);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle boundary limit values', async () => {
      // Arrange
      const validLimits = [1, 50, 100];

      for (const limit of validLimits) {
        // Act
        const query = plainToClass(GetRealTimeSignalsQuery, { limit });
        const errors = await validate(query);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle various boolean string representations', async () => {
      // Arrange
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      for (const testCase of testCases) {
        // Act
        const query = plainToClass(GetRealTimeSignalsQuery, {
          adaptiveThresholds: testCase.input,
          tickAnalysis: testCase.input,
        });
        const errors = await validate(query);

        // Assert
        expect(errors).toHaveLength(0);
        expect(query.adaptiveThresholds).toBe(testCase.expected);
        expect(query.tickAnalysis).toBe(testCase.expected);
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete valid query', async () => {
      // Arrange
      const queryData = {
        timeframes: 'tf1m,tf5m,tf15m',
        threshold: '80',
        limit: '25',
        adaptiveThresholds: 'true',
        tickAnalysis: 'false',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.timeframes).toEqual([Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M]);
      expect(query.threshold).toBe(80);
      expect(query.limit).toBe(25);
      expect(query.adaptiveThresholds).toBe(true);
      expect(query.tickAnalysis).toBe(false);
    });

    it('should handle partial query with defaults', async () => {
      // Arrange
      const queryData = {
        timeframes: 'tf1m',
        threshold: '75',
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors).toHaveLength(0);
      expect(query.timeframes).toEqual([Timeframe.TF1M]);
      expect(query.threshold).toBe(75);
      expect(query.limit).toBe(20); // Default
      expect(query.adaptiveThresholds).toBe(true); // Default
      expect(query.tickAnalysis).toBe(true); // Default
    });

    it('should handle multiple validation errors', async () => {
      // Arrange
      const queryData = {
        timeframes: ['invalid'],
        threshold: 30, // Pod minimem
        limit: 150, // Nad maximem
      };

      // Act
      const query = plainToClass(GetRealTimeSignalsQuery, queryData);
      const errors = await validate(query);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('timeframes');
      expect(errorProperties).toContain('threshold');
      expect(errorProperties).toContain('limit');
    });
  });
});
