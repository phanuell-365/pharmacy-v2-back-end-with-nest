import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USER_REPOSITORY } from '../../users/constants';
import { Inject } from '@nestjs/common';
import { User } from '../../users/entities';
import * as fs from 'fs';
import * as path from 'path';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userModel: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: fs.readFileSync(
        path.join(__dirname, '../../../src/auth', '/keys/public.pem'),
        'utf8',
      ),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return await this.userModel.findByPk(payload.sub);
  }
}
