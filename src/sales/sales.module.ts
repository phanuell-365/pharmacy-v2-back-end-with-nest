import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CustomersModule } from '../customers/customers.module';
import { StockModule } from '../stock/stock.module';
import { MedicinesModule } from '../medicines/medicines.module';
import { stockProvider } from '../stock/stock.provider';
import { salesProvider } from './sales.provider';
import { medicinesProvider } from '../medicines/medicines.provider';
import { customersProvider } from '../customers/customers.provider';

@Module({
  imports: [CustomersModule, StockModule, SalesModule, MedicinesModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    ...stockProvider,
    ...salesProvider,
    ...medicinesProvider,
    ...customersProvider,
  ],
})
export class SalesModule {}
