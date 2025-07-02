import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CoinGeckoTicker } from './dto/coingecko-ticker.dto';
import { MarketCapData } from '../coinmarketcap/coinmarketcap.service';

@Injectable()
export class CoinGeckoService {
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly API_KEY = process.env.COINGECKO_API_KEY;
  private marketCapCache: { [symbol: string]: MarketCapData } = {};
  private lastCacheUpdate = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000;

  async getMarketCapData(symbols: string[]): Promise<MarketCapData[]> {
    // Check if we need to refresh cache
    if (this.shouldRefreshCache()) {
      await this.refreshMarketCapCache();
    }

    // Return cached data for requested symbols
    const requestedSymbols = symbols.map((s) => s.toLowerCase());
    return requestedSymbols
      .map((symbol) => this.marketCapCache[symbol])
      .filter((data) => data !== undefined);
  }

  async getMarketCapDataForSymbol(symbol: string): Promise<MarketCapData | null> {
    if (this.shouldRefreshCache()) {
      await this.refreshMarketCapCache();
    }

    const results = await this.getMarketCapData([symbol]);
    return results.length > 0 ? results[0] : null;
  }

  async getTopMarketCaps(limit: number = 100): Promise<MarketCapData[]> {
    // Check if we need to refresh cache
    if (this.shouldRefreshCache()) {
      await this.refreshMarketCapCache();
    }

    // Return top coins from cache
    const allCoins = Object.values(this.marketCapCache);
    return allCoins.sort((a, b) => a.marketCapRank - b.marketCapRank).slice(0, limit);
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.lastCacheUpdate > this.CACHE_DURATION;
  }

  private async refreshMarketCapCache(): Promise<void> {
    try {
      console.log('Refreshing market cap cache from CoinGecko...');

      // Fetch all coins market data in one API call
      const response = await axios.get(`${this.BASE_URL}/coins/markets`, {
        headers: {
          'x-cg-demo-api-key': this.API_KEY,
        },
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          locale: 'en',
        },
      });

      const coins: CoinGeckoTicker[] = response.data;

      // Clear existing cache and populate with new data
      this.marketCapCache = {};

      coins.forEach((coin) => {
        this.marketCapCache[coin.symbol.toLowerCase()] = {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          currentPrice: coin.current_price,
          marketCap: coin.market_cap,
          marketCapRank: coin.market_cap_rank,
          volume24h: coin.total_volume,
          priceChange24h: coin.price_change_24h,
          priceChangePercentage24h: coin.price_change_percentage_24h,
          circulatingSupply: coin.circulating_supply,
          totalSupply: coin.total_supply,
          maxSupply: coin.max_supply,
        };
      });

      this.lastCacheUpdate = Date.now();
      console.log(
        `Market cap cache refreshed with ${Object.keys(this.marketCapCache).length} coins`,
      );
    } catch (error) {
      console.error('Error refreshing market cap cache from CoinGecko:', error);
      // If API fails, use fallback data
      this.populateFallbackCache();
    }
  }

  private populateFallbackCache(): void {
    const fallbackData: { [key: string]: MarketCapData } = {
      btc: {
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
      eth: {
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
      ada: {
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
      sol: {
        symbol: 'SOL',
        name: 'Solana',
        currentPrice: 100,
        marketCap: 40000000000,
        marketCapRank: 5,
        volume24h: 2000000000,
        priceChange24h: 2,
        priceChangePercentage24h: 2.0,
        circulatingSupply: 400000000,
        totalSupply: 400000000,
        maxSupply: null,
      },
      bnb: {
        symbol: 'BNB',
        name: 'BNB',
        currentPrice: 300,
        marketCap: 45000000000,
        marketCapRank: 4,
        volume24h: 1500000000,
        priceChange24h: 3,
        priceChangePercentage24h: 1.0,
        circulatingSupply: 150000000,
        totalSupply: 150000000,
        maxSupply: null,
      },
    };

    this.marketCapCache = fallbackData;
    this.lastCacheUpdate = Date.now();
    console.log('Using fallback market cap data');
  }

  // Method to manually refresh cache if needed
  async forceRefreshCache(): Promise<void> {
    this.lastCacheUpdate = 0; // Force refresh
    await this.refreshMarketCapCache();
  }

  // Get cache statistics
  getCacheStats(): { cacheSize: number; lastUpdate: Date; isStale: boolean } {
    return {
      cacheSize: Object.keys(this.marketCapCache).length,
      lastUpdate: new Date(this.lastCacheUpdate),
      isStale: this.shouldRefreshCache(),
    };
  }
}
