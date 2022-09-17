import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto, UpdateStockDto } from './dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  create(
    @Body('MedicineId') medicineId: string,
    @Body() createStockDto: CreateStockDto,
  ) {
    return this.stockService.create(medicineId, createStockDto);
  }

  @Get()
  findAll(@Query('withId') withId: boolean, @Query('cat') cat: string) {
    if (cat === 'out-of-stock')
      return this.stockService.findAllMedicinesOutOfStock(withId);
    return this.stockService.findAll(withId);
  }

  @Get(':id')
  findOne(@Query('withId') withId: boolean, @Param('id') stockId: string) {
    return this.stockService.findOne(stockId, withId);
  }

  @Patch(':id')
  update(
    @Query('withId') withId: boolean,
    @Param('id') stockId: string,
    @Body('MedicineId') medicineId: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    if (!withId)
      return this.stockService.updateWithoutIds(
        medicineId,
        stockId,
        updateStockDto,
      );
    return this.stockService.updateWithIds(medicineId, stockId, updateStockDto);
  }

  @Delete(':id')
  remove(@Param('id') stockId: string) {
    return this.stockService.remove(stockId);
  }
}
