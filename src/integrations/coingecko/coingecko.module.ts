import { Module } from '@nestjs/common';
import { CoinGeckoController } from './coingecko.controller';
import { CoinGeckoService } from './coingecko.service';

@Module({
  controllers: [CoinGeckoController],
  providers: [CoinGeckoService],
  exports: [CoinGeckoService],
})
export class CoinGeckoModule {}
