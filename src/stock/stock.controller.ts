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

@Controller('stock')
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
  findAll(@Query('withId') withId: boolean) {
    if (!withId) return this.stockService.findAllWithoutIds();
    return this.stockService.findAllWithIds();
  }

  @Get(':id')
  findOne(@Query('withId') withId: boolean, @Param('id') stockId: string) {
    if (!withId) return this.stockService.findOneWithoutIds(stockId);
    return this.stockService.findOneWithIds(stockId);
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
