import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  issueToken(clientId: string) {
    const payload = { clientId };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}
