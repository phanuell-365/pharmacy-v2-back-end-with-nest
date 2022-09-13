import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { customersProvider } from './customers.provider';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, ...customersProvider],
})
export class CustomersModule {}
