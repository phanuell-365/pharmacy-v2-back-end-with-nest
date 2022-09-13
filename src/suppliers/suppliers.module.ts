import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { suppliersProvider } from './suppliers.provider';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, ...suppliersProvider],
})
export class SuppliersModule {}
