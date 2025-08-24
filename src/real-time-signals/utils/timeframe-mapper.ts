import { Timeframe } from '../enums/timeframe.enum';
import { KlineIntervalV3 } from 'bybit-api';

export class TimeframeMapper {
  static toBybitInterval(timeframe: Timeframe): KlineIntervalV3 {
    switch (timeframe) {
      case Timeframe.TF1M:
        return '1';
      case Timeframe.TF5M:
        return '5';
      case Timeframe.TF15M:
        return '15';
      case Timeframe.TF1H:
        return '60';
      case Timeframe.TF4H:
        return '240';
      default:
        throw new Error(
          `Unsupported timeframe: ${timeframe}. Supported timeframes are: ${Object.values(Timeframe).join(', ')}`,
        );
    }
  }

  static getTimeframeDescription(timeframe: Timeframe): string {
    switch (timeframe) {
      case Timeframe.TF1M:
        return '1 minute';
      case Timeframe.TF5M:
        return '5 minutes';
      case Timeframe.TF15M:
        return '15 minutes';
      case Timeframe.TF1H:
        return '1 hour';
      case Timeframe.TF4H:
        return '4 hours';
      default:
        return 'unknown';
    }
  }

  static isValidTimeframe(timeframe: string): timeframe is Timeframe {
    return Object.values(Timeframe).includes(timeframe as Timeframe);
  }
}
