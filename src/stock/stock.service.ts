import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateStockDto, UpdateStockDto } from './dto';
import { STOCK_REPOSITORY } from './constants';
import { Stock } from './entities';
import { MedicinesService } from '../medicines/medicines.service';

@Injectable()
export class StockService {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: typeof Stock,
    private readonly medicineService: MedicinesService,
  ) {}

  async getStock(stockId) {
    const stock = await this.stockRepository.findByPk(stockId);

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    return stock;
  }

  async getMedicine(medicineId: string) {
    const medicine = await this.medicineService.findOne(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    return medicine;
  }

  async create(medicineId: string, createStockDto: CreateStockDto) {
    const medicine = await this.getMedicine(medicineId);

    const stock = await this.stockRepository.findOne({
      where: {
        medicineId: medicine.id,
      },
    });

    if (stock) {
      throw new ConflictException('Medicine has an associated stock');
    }

    return await this.stockRepository.create({
      ...createStockDto,
      MedicineId: medicine.id,
    });
  }

  async getMedicineName(medicineId: string) {
    const medicine = await this.getMedicine(medicineId);

    return medicine.name;
  }

  async returnStockWithoutIds(stock: Stock): Promise<ReturnStockDto> {
    return {
      id: stock.id,
      packSizePrice: stock.packSizePrice,
      medicine: await this.getMedicineName(stock.MedicineId),
      packSize: stock.packSize,
      issueUnitPrice: stock.issueUnitPrice,
      issueUnitPerPackSize: stock.issueUnitPerPackSize,
      expirationDate: stock.expirationDate,
    };
  }

  /**
   * @description Returns an array of stock with medicine name
   * @return Promise<Awaited<ReturnStockDto>[]>
   */
  async findAllWithoutIds(): Promise<Awaited<ReturnStockDto>[]> {
    const stocks = await this.stockRepository.findAll();

    return await Promise.all(
      stocks.map(async (value) => await this.returnStockWithoutIds(value)),
    );
  }

  /**
   * @description Returns an array of stocks with medicine id
   * @return Promise<Stock[]>
   */
  async findAllWithIds(): Promise<Stock[]> {
    return await this.stockRepository.findAll();
  }

  async findOneWithIds(id: string) {
    return await this.getStock(id);
  }

  async findOneWithoutIds(id: string): Promise<ReturnStockDto> {
    const stock = await this.getStock(id);

    return await this.returnStockWithoutIds(stock);
  }

  async update(
    medicineId: string,
    stockId: string,
    updateStockDto: UpdateStockDto,
  ) {
    const medicine = await this.getMedicine(medicineId);

    const existingStock = await this.stockRepository.findOne({
      where: {
        MedicineId: medicine.id,
      },
    });

    const stock = await this.stockRepository.findByPk(stockId);

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    if (existingStock) {
      if (existingStock.MedicineId !== stock.MedicineId) {
        throw new ConflictException('Medicine has an associated stock');
      }
    }

    return await stock.update({ ...updateStockDto });
  }

  async updateWithIds(
    medicineId: string,
    stockId: string,
    updateStockDto: UpdateStockDto,
  ) {
    return await this.update(medicineId, stockId, updateStockDto);
  }

  async updateWithoutIds(
    medicineId: string,
    stockId: string,
    updateStockDto: UpdateStockDto,
  ) {
    return await this.returnStockWithoutIds(
      await this.update(medicineId, stockId, updateStockDto),
    );
  }

  async remove(stockId: string) {
    const stock = await this.stockRepository.findByPk(stockId);

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    // if (process.env.NODE_ENV === 'test') {
    //   return await stock.destroy({
    //     force: true,
    //   });
    // }

    return await stock.destroy();
  }
}
