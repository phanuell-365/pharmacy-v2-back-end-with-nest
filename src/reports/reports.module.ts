import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { usersProvider } from '../users/users.provider';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, UsersService, ...usersProvider],
  imports: [UsersModule],
})
export class ReportsModule {}
