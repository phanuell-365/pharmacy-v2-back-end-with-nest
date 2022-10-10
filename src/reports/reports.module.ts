import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { usersProvider } from '../users/users.provider';
import { OrdersService } from '../orders/orders.service';
import { ordersProvider } from '../orders/orders.provider';
import { OrdersModule } from '../orders/orders.module';
import { medicinesProvider } from '../medicines/medicines.provider';
import { suppliersProvider } from '../suppliers/suppliers.provider';
import { MedicinesService } from '../medicines/medicines.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { MedicinesModule } from '../medicines/medicines.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { salesProvider } from '../sales/sales.provider';
import { SalesModule } from '../sales/sales.module';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { customersProvider } from '../customers/customers.provider';
import { CustomersModule } from '../customers/customers.module';
import { purchasesRepository } from '../purchases/purchases.repository';
import { PurchasesModule } from '../purchases/purchases.module';
import { PurchasesService } from '../purchases/purchases.service';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    UsersService,
    OrdersService,
    MedicinesService,
    SuppliersService,
    CustomersService,
    PurchasesService,
    SalesService,
    ...usersProvider,
    ...ordersProvider,
    ...medicinesProvider,
    ...suppliersProvider,
    ...customersProvider,
    ...purchasesRepository,
    ...salesProvider,
  ],
  imports: [
    UsersModule,
    MedicinesModule,
    SuppliersModule,
    OrdersModule,
    CustomersModule,
    PurchasesModule,
    SalesModule,
  ],
})
export class ReportsModule {}
