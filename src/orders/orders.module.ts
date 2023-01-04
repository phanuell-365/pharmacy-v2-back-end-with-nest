import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ordersProvider } from './orders.provider';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { MedicinesModule } from '../medicines/medicines.module';
// import { StockModule } from '../stock/stock.module';
import { suppliersProvider } from '../suppliers/suppliers.provider';
import { medicinesProvider } from '../medicines/medicines.provider';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    SuppliersModule,
    MedicinesModule,
    AnalyticsModule,
    // StockModule
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    ...ordersProvider,
    ...suppliersProvider,
    ...medicinesProvider,
    // ...stockProvider,
  ],
})
export class OrdersModule {}
