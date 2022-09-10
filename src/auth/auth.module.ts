import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { EXPIRES_IN } from './constants';
import * as fs from 'fs';
import * as path from 'path';
import { usersProvider } from '../users/users.provider';
import { JwtStrategy } from './strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const options: JwtModuleOptions = {
          privateKey: fs.readFileSync(
            path.join(__dirname, '../../src/auth', '/keys/private.pem'),
            'utf8',
          ),
          publicKey: fs.readFileSync(
            path.join(__dirname, '../../src/auth', '/keys/public.pem'),
            'utf8',
          ),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: EXPIRES_IN,
          },
        };
        return options;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ...usersProvider, JwtStrategy],
})
export class AuthModule {}
