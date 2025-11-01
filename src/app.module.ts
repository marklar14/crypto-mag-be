import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BybitModule } from './bybit/bybit.module';
import { ScreenerModule } from './screener/screener.module';
import { CoinGeckoModule } from './integrations/coingecko/coingecko.module';
import { RealTimeSignalsModule } from './real-time-signals/real-time-signals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BybitModule,
    ScreenerModule,
    CoinGeckoModule,
    RealTimeSignalsModule,
  ],
})
export class AppModule {}
