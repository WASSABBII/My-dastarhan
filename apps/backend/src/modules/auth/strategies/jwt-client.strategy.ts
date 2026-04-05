import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

@Injectable()
export class JwtClientStrategy extends PassportStrategy(Strategy, 'jwt-client') {
  constructor(
    config: ConfigService,
    @InjectRepository(Client) private clientsRepo: Repository<Client>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.clientSecret') || 'fallback_client',
    });
  }

  async validate(payload: { sub: string; phone: string }) {
    const client = await this.clientsRepo.findOne({ where: { id: payload.sub } });
    if (!client) throw new UnauthorizedException();
    return client;
  }
}
