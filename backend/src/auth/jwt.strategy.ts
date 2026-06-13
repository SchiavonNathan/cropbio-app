import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_SUPER_SECRETA_MUDE_EM_PROD',
    });
  }

  async validate(payload: any) {
    // Retorna os dados do token direto para o request.user
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
