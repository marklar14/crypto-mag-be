import { Controller, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('token')
  getAccessToken(@Headers('x-api-key') apiKey: string) {
    if (apiKey !== process.env.FRONTEND_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }

    const clientId = 'frontend-angular-app';
    return this.authService.issueToken(clientId);
  }
}
