import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface CoinMarketCapTicker {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number;
  circulating_supply: number;
  total_supply: number;
  infinite_supply: boolean;
  platform: any;
  cmc_rank: number;
  self_reported_circulating_supply: any;
  self_reported_market_cap: any;
  tvl_ratio: any;
  last_updated: string;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      tvl: any;
      last_updated: string;
    };
  };
}

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

@Injectable()
export class CoinMarketCapService {
  private readonly API_KEY = process.env.COINMARKETCAP_API_KEY;
  private readonly BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

  async getMarketCapData(symbols: string[]): Promise<MarketCapData[]> {
    try {
      if (!this.API_KEY) {
        console.warn('CoinMarketCap API key not found. Using fallback data.');
        return this.getFallbackMarketCapData(symbols);
      }

      const response = await axios.get(`${this.BASE_URL}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.API_KEY,
        },
        params: {
          symbol: symbols.join(','),
          convert: 'USD',
        },
      });

      const data = response.data.data;
      const results: MarketCapData[] = [];

      for (const symbol of symbols) {
        const coinData = data[symbol];
        if (coinData) {
          const quote = coinData.quote.USD;
          results.push({
            symbol: coinData.symbol,
            name: coinData.name,
            currentPrice: quote.price,
            marketCap: quote.market_cap,
            marketCapRank: coinData.cmc_rank,
            volume24h: quote.volume_24h,
            priceChange24h: quote.percent_change_24h,
            priceChangePercentage24h: quote.percent_change_24h,
            circulatingSupply: coinData.circulating_supply,
            totalSupply: coinData.total_supply,
            maxSupply: coinData.max_supply,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching market cap data from CoinMarketCap:', error);
      return this.getFallbackMarketCapData(symbols);
    }
  }

  async getMarketCapDataForSymbol(symbol: string): Promise<MarketCapData | null> {
    const results = await this.getMarketCapData([symbol]);
    return results.length > 0 ? results[0] : null;
  }

  async getTopMarketCaps(limit: number = 100): Promise<MarketCapData[]> {
    try {
      if (!this.API_KEY) {
        console.warn('CoinMarketCap API key not found. Using fallback data.');
        return this.getFallbackTopMarketCaps(limit);
      }

      const response = await axios.get(`${this.BASE_URL}/cryptocurrency/listings/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.API_KEY,
        },
        params: {
          limit,
          convert: 'USD',
        },
      });

      const coins: CoinMarketCapTicker[] = response.data.data;

      return coins.map((coin) => {
        const quote = coin.quote.USD;
        return {
          symbol: coin.symbol,
          name: coin.name,
          currentPrice: quote.price,
          marketCap: quote.market_cap,
          marketCapRank: coin.cmc_rank,
          volume24h: quote.volume_24h,
          priceChange24h: quote.percent_change_24h,
          priceChangePercentage24h: quote.percent_change_24h,
          circulatingSupply: coin.circulating_supply,
          totalSupply: coin.total_supply,
          maxSupply: coin.max_supply,
        };
      });
    } catch (error) {
      console.error('Error fetching top market caps from CoinMarketCap:', error);
      return this.getFallbackTopMarketCaps(limit);
    }
  }

  // Fallback data when API key is not available or API fails
  private getFallbackMarketCapData(symbols: string[]): MarketCapData[] {
    const fallbackData: { [key: string]: MarketCapData } = {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: 65000,
        marketCap: 1200000000000,
        marketCapRank: 1,
        volume24h: 25000000000,
        priceChange24h: 1000,
        priceChangePercentage24h: 1.56,
        circulatingSupply: 19500000,
        totalSupply: 21000000,
        maxSupply: 21000000,
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        currentPrice: 3500,
        marketCap: 400000000000,
        marketCapRank: 2,
        volume24h: 15000000000,
        priceChange24h: 50,
        priceChangePercentage24h: 1.45,
        circulatingSupply: 120000000,
        totalSupply: 120000000,
        maxSupply: null,
      },
      ADA: {
        symbol: 'ADA',
        name: 'Cardano',
        currentPrice: 0.5,
        marketCap: 17500000000,
        marketCapRank: 8,
        volume24h: 500000000,
        priceChange24h: 0.02,
        priceChangePercentage24h: 4.0,
        circulatingSupply: 35000000000,
        totalSupply: 45000000000,
        maxSupply: 45000000000,
      },
    };

    return symbols
      .map((symbol) => fallbackData[symbol.toUpperCase()])
      .filter((data) => data !== undefined);
  }

  private getFallbackTopMarketCaps(limit: number): MarketCapData[] {
    const topCoins = [
      { symbol: 'BTC', name: 'Bitcoin', price: 65000, marketCap: 1200000000000, rank: 1 },
      { symbol: 'ETH', name: 'Ethereum', price: 3500, marketCap: 400000000000, rank: 2 },
      { symbol: 'USDT', name: 'Tether', price: 1.0, marketCap: 95000000000, rank: 3 },
      { symbol: 'BNB', name: 'BNB', price: 300, marketCap: 45000000000, rank: 4 },
      { symbol: 'SOL', name: 'Solana', price: 100, marketCap: 40000000000, rank: 5 },
    ];

    return topCoins.slice(0, limit).map((coin) => ({
      symbol: coin.symbol,
      name: coin.name,
      currentPrice: coin.price,
      marketCap: coin.marketCap,
      marketCapRank: coin.rank,
      volume24h: coin.marketCap * 0.02, // Approximate 2% daily volume
      priceChange24h: coin.price * 0.01, // Approximate 1% change
      priceChangePercentage24h: 1.0,
      circulatingSupply: coin.marketCap / coin.price,
      totalSupply: coin.marketCap / coin.price,
      maxSupply: null,
    }));
  }
}
