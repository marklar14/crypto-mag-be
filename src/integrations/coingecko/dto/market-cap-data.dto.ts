export interface MarketCapData {
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number | null;
}
