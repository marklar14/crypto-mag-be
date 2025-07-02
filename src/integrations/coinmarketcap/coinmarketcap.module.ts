import { Module } from '@nestjs/common';
import { CoinMarketCapController } from './coinmarketcap.controller';
import { CoinMarketCapService } from './coinmarketcap.service';

@Module({
  controllers: [CoinMarketCapController],
  providers: [CoinMarketCapService],
  exports: [CoinMarketCapService],
})
export class CoinMarketCapModule {}
