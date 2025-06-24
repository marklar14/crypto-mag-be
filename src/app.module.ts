import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BybitController } from './bybit/bybit.controller';
import { BybitService } from './bybit/bybit.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from './auth/jwt/jwt.service';

@Module({
  imports: [AuthModule],
  controllers: [AppController, BybitController],
  providers: [AppService, BybitService, JwtService],
})
export class AppModule {}
