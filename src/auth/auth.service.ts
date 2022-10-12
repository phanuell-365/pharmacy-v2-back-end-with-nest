import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../users/constants';
import { User } from '../users/entities';
import { Role } from '../users/enums';
import { CreateUserDto } from '../users/dto';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { EXPIRES_IN } from './constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: typeof User,
    private readonly jwtService: JwtService,
  ) {}

  async createDefaultAdmin() {
    const user = await this.usersRepository.findOne({
      where: {
        role: Role.ADMIN,
      },
    });

    if (user) {
      return user;
    } else {
      const admin: CreateUserDto = {
        username: 'Admin',
        email: 'administrator@localhost.com',
        password: 'admin',
        phone: '0712345678',
        role: Role.ADMIN,
      };

      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);

      try {
        await this.usersRepository.create({
          ...admin,
        });
      } catch (error: any) {
        console.error(error);
      }

      return undefined;
    }
  }

  async login(user: AuthDto): Promise<{
    access_token: string;
    role: Role;
    userId: string;
    expires_in: string;
  }> {
    // create a default admin if there is none
    const createdUser = await this.createDefaultAdmin();

    if (createdUser) {
      if (createdUser.username !== user.username) {
        throw new ForbiddenException('Invalid username or password!');
      }
    }
    const userFound = await this.usersRepository.unscoped().findOne({
      where: {
        username: user.username,
      },
    });

    if (!userFound) {
      throw new ForbiddenException('Invalid username or password!');
    }

    if (user.username !== userFound.username) {
      throw new ForbiddenException('Invalid username or password!');
    }

    const isPasswordMatching = await bcrypt.compare(
      user.password,
      userFound.password,
    );

    if (!isPasswordMatching) {
      throw new ForbiddenException('Invalid username or password!');
    }

    return {
      access_token: this.signToken(userFound.id, userFound.username),
      userId: userFound.id,
      role: userFound.role,
      expires_in: EXPIRES_IN,
    };
  }

  signToken(userId: string, username: string) {
    const payload = {
      sub: userId,
      username,
    };

    const options: JwtSignOptions = {
      expiresIn: EXPIRES_IN,
      algorithm: 'RS256',
    };

    return this.jwtService.sign(payload, options);
  }
}
