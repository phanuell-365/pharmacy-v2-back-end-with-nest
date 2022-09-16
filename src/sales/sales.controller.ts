import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { SalesStatus } from './enums';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(
    // @Body('MedicineId') medicineId: string,
    // @Body('CustomerId') customerId: string,
    @Body() createSaleDto: CreateSaleDto[],
  ) {
    return this.salesService.create(
      // medicineId,
      // customerId,
      createSaleDto,
    );
  }

  @Get()
  findAll(
    @Query('resource') resource: string,
    @Query('status') status: string,
    @Query('date') saleDate: Date,
    @Query('customerId') customerId: string,
    @Query('withId') withId: boolean,
  ) {
    if (resource && resource === 'status') {
      return this.salesService.findSalesStatus();
    }

    switch (status) {
      case SalesStatus.ISSUED:
        return this.salesService.findAllIssuedSales(withId);
      case SalesStatus.PENDING:
        return this.salesService.findAllPendingSales(withId);
      case SalesStatus.CANCELLED:
        return this.salesService.findAllCancelledSales(withId);
      default: {
        return this.salesService.findAll(saleDate, customerId, withId);
      }
    }
  }

  @Get(':id')
  findOne(@Query('withId') withId: boolean, @Param('id') salesId: string) {
    return this.salesService.findOne(salesId, withId);
  }

  @Patch(':id')
  update(
    @Param('id') salesId: string,
    @Body('MedicineId') medicineId: string,
    @Body('CustomerId') customerId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(
      medicineId,
      customerId,
      salesId,
      updateSaleDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') salesId: string) {
    return this.salesService.remove(salesId);
  }
}
