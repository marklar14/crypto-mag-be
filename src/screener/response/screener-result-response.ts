import { ScreenerSetupResponse, ScreenerSetup, SignalDescription } from './screener-setup-response';

export interface ScreenerResultResponse {
  symbol: string;
  lastPrice: number;
  previousPrice: number;
  changePercent: number;
  volume24h: number;

  // Market cap data
  marketCap?: number;
  marketCapRank?: number;
  circulatingSupply?: number;

  rsi?: number;
  macdHist?: number;
  adx?: number;
  bbWidth?: number;
  volumeSpike?: number;

  isAbove200Ema?: boolean;
  isBreakout?: boolean;
  isBreakdown?: boolean;

  signal?: ScreenerSetupResponse;
  matchedSetups: ScreenerSetupResponse[];

  // New signal description
  description?: SignalDescription;
  matchedSetupsWithDescriptions?: ScreenerSetup[];
}
