import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { usersProvider } from './users.provider';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ...usersProvider],
  exports: [UsersService],
})
export class UsersModule {}
