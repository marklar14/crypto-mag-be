import { ScreenerResultResponse } from './screener-result-response';

export interface MultiTimeframeData {
  symbol: string;
  tf5m: Partial<ScreenerResultResponse>;
  tf15m: Partial<ScreenerResultResponse>;
  tf1h: Partial<ScreenerResultResponse>;
  tf1d: Partial<ScreenerResultResponse>;
}
