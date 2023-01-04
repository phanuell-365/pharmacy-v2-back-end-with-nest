import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { salesProvider } from '../sales/sales.provider';
import { PurchasesService } from '../purchases/purchases.service';
import { purchasesRepository } from '../purchases/purchases.repository';
import { ordersProvider } from '../orders/orders.provider';
import { OrdersService } from '../orders/orders.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { OrdersModule } from '../orders/orders.module';
import { customersProvider } from '../customers/customers.provider';
import { CustomersService } from '../customers/customers.service';
import { MedicinesModule } from '../medicines/medicines.module';
import { SalesModule } from '../sales/sales.module';
import { SalesService } from '../sales/sales.service';
import { suppliersProvider } from '../suppliers/suppliers.provider';
import { PurchasesModule } from '../purchases/purchases.module';
import { CustomersModule } from '../customers/customers.module';
import { medicinesProvider } from '../medicines/medicines.provider';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { MedicinesService } from '../medicines/medicines.service';
import { MedicinesModule } from './medicines/medicines.module';
import { SalesModule } from './sales/sales.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    OrdersService,
    MedicinesService,
    SuppliersService,
    CustomersService,
    PurchasesService,
    SalesService,
    ...ordersProvider,
    ...medicinesProvider,
    ...suppliersProvider,
    ...customersProvider,
    ...purchasesRepository,
    ...salesProvider,
  ],
  imports: [
    MedicinesModule,
    SuppliersModule,
    OrdersModule,
    CustomersModule,
    PurchasesModule,
    SalesModule,
  ],
})
export class AnalyticsModule {}
