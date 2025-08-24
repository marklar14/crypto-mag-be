import { SignalType, SignalStrength } from './signal-types';

describe('Signal Types', () => {
  describe('SignalType', () => {
    it('should accept valid signal types', () => {
      // Arrange
      const validSignalTypes: SignalType[] = ['bullish', 'bearish', 'neutral'];

      // Act & Assert
      validSignalTypes.forEach((signalType) => {
        expect(typeof signalType).toBe('string');
        expect(['bullish', 'bearish', 'neutral']).toContain(signalType);
      });
    });

    it('should have correct type inference', () => {
      // Arrange
      const bullishSignal: SignalType = 'bullish';
      const bearishSignal: SignalType = 'bearish';
      const neutralSignal: SignalType = 'neutral';

      // Act & Assert
      expect(bullishSignal).toBe('bullish');
      expect(bearishSignal).toBe('bearish');
      expect(neutralSignal).toBe('neutral');
    });

    it('should work with type guards', () => {
      // Arrange
      const isBullish = (signal: SignalType): boolean => signal === 'bullish';
      const isBearish = (signal: SignalType): boolean => signal === 'bearish';
      const isNeutral = (signal: SignalType): boolean => signal === 'neutral';

      // Act & Assert
      expect(isBullish('bullish')).toBe(true);
      expect(isBullish('bearish')).toBe(false);
      expect(isBullish('neutral')).toBe(false);

      expect(isBearish('bullish')).toBe(false);
      expect(isBearish('bearish')).toBe(true);
      expect(isBearish('neutral')).toBe(false);

      expect(isNeutral('bullish')).toBe(false);
      expect(isNeutral('bearish')).toBe(false);
      expect(isNeutral('neutral')).toBe(true);
    });
  });

  describe('SignalStrength', () => {
    it('should accept valid signal strengths', () => {
      // Arrange
      const validSignalStrengths: SignalStrength[] = ['weak', 'medium', 'strong'];

      // Act & Assert
      validSignalStrengths.forEach((signalStrength) => {
        expect(typeof signalStrength).toBe('string');
        expect(['weak', 'medium', 'strong']).toContain(signalStrength);
      });
    });

    it('should have correct type inference', () => {
      // Arrange
      const weakSignal: SignalStrength = 'weak';
      const mediumSignal: SignalStrength = 'medium';
      const strongSignal: SignalStrength = 'strong';

      // Act & Assert
      expect(weakSignal).toBe('weak');
      expect(mediumSignal).toBe('medium');
      expect(strongSignal).toBe('strong');
    });

    it('should work with type guards', () => {
      // Arrange
      const isWeak = (signal: SignalStrength): boolean => signal === 'weak';
      const isMedium = (signal: SignalStrength): boolean => signal === 'medium';
      const isStrong = (signal: SignalStrength): boolean => signal === 'strong';

      // Act & Assert
      expect(isWeak('weak')).toBe(true);
      expect(isWeak('medium')).toBe(false);
      expect(isWeak('strong')).toBe(false);

      expect(isMedium('weak')).toBe(false);
      expect(isMedium('medium')).toBe(true);
      expect(isMedium('strong')).toBe(false);

      expect(isStrong('weak')).toBe(false);
      expect(isStrong('medium')).toBe(false);
      expect(isStrong('strong')).toBe(true);
    });
  });

  describe('Integration with business logic', () => {
    it('should work with signal type determination', () => {
      // Arrange
      const determineSignalType = (changePercent: number): SignalType => {
        if (changePercent > 0.5) return 'bullish';
        if (changePercent < -0.5) return 'bearish';
        return 'neutral';
      };

      // Act & Assert
      expect(determineSignalType(1.0)).toBe('bullish');
      expect(determineSignalType(-1.0)).toBe('bearish');
      expect(determineSignalType(0.0)).toBe('neutral');
    });

    it('should work with signal strength determination', () => {
      // Arrange
      const determineSignalStrength = (absChangePercent: number): SignalStrength => {
        if (absChangePercent > 5) return 'strong';
        if (absChangePercent > 2) return 'medium';
        return 'weak';
      };

      // Act & Assert
      expect(determineSignalStrength(6.0)).toBe('strong');
      expect(determineSignalStrength(3.0)).toBe('medium');
      expect(determineSignalStrength(1.0)).toBe('weak');
    });

    it('should work with signal filtering', () => {
      // Arrange
      const signals: Array<{ signalType: SignalType; signalStrength: SignalStrength }> = [
        { signalType: 'bullish', signalStrength: 'strong' },
        { signalType: 'bearish', signalStrength: 'medium' },
        { signalType: 'neutral', signalStrength: 'weak' },
        { signalType: 'bullish', signalStrength: 'weak' },
      ];

      // Act
      const bullishSignals = signals.filter((s) => s.signalType === 'bullish');
      const strongSignals = signals.filter((s) => s.signalStrength === 'strong');
      const bullishStrongSignals = signals.filter(
        (s) => s.signalType === 'bullish' && s.signalStrength === 'strong',
      );

      // Assert
      expect(bullishSignals).toHaveLength(2);
      expect(strongSignals).toHaveLength(1);
      expect(bullishStrongSignals).toHaveLength(1);
    });

    it('should work with signal counting', () => {
      // Arrange
      const signals: Array<{ signalType: SignalType; signalStrength: SignalStrength }> = [
        { signalType: 'bullish', signalStrength: 'strong' },
        { signalType: 'bearish', signalStrength: 'medium' },
        { signalType: 'neutral', signalStrength: 'weak' },
        { signalType: 'bullish', signalStrength: 'weak' },
        { signalType: 'bearish', signalStrength: 'strong' },
      ];

      // Act
      const bullishCount = signals.filter((s) => s.signalType === 'bullish').length;
      const bearishCount = signals.filter((s) => s.signalType === 'bearish').length;
      const neutralCount = signals.filter((s) => s.signalType === 'neutral').length;
      const strongCount = signals.filter((s) => s.signalStrength === 'strong').length;

      // Assert
      expect(bullishCount).toBe(2);
      expect(bearishCount).toBe(2);
      expect(neutralCount).toBe(1);
      expect(strongCount).toBe(2);
    });
  });

  describe('Type safety', () => {
    it('should prevent invalid signal types at compile time', () => {
      // This test demonstrates type safety - TypeScript should catch these errors
      // Note: These would cause compilation errors in real code

      // const invalidSignalType: SignalType = 'invalid'; // This would cause TS error
      // const invalidSignalStrength: SignalStrength = 'invalid'; // This would cause TS error

      // Instead, we test that valid types work
      const validSignalType: SignalType = 'bullish';
      const validSignalStrength: SignalStrength = 'strong';

      expect(validSignalType).toBe('bullish');
      expect(validSignalStrength).toBe('strong');
    });

    it('should work with switch statements', () => {
      // Arrange
      const getSignalDescription = (signalType: SignalType): string => {
        switch (signalType) {
          case 'bullish':
            return 'Price is going up';
          case 'bearish':
            return 'Price is going down';
          case 'neutral':
            return 'Price is sideways';
          default:
            return 'Unknown signal';
        }
      };

      const getStrengthDescription = (signalStrength: SignalStrength): string => {
        switch (signalStrength) {
          case 'weak':
            return 'Weak signal';
          case 'medium':
            return 'Medium signal';
          case 'strong':
            return 'Strong signal';
          default:
            return 'Unknown strength';
        }
      };

      // Act & Assert
      expect(getSignalDescription('bullish')).toBe('Price is going up');
      expect(getSignalDescription('bearish')).toBe('Price is going down');
      expect(getSignalDescription('neutral')).toBe('Price is sideways');

      expect(getStrengthDescription('weak')).toBe('Weak signal');
      expect(getStrengthDescription('medium')).toBe('Medium signal');
      expect(getStrengthDescription('strong')).toBe('Strong signal');
    });
  });
});
