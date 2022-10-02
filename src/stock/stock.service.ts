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
import { Op } from 'sequelize';
import { Medicine } from '../medicines/entities';

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
      packSizeQuantity: stock.packSizeQuantity,
      issueUnitPrice: stock.issueUnitPrice,
      issueUnitPerPackSize: stock.issueUnitPerPackSize,
      issueQuantity: stock.issueQuantity,
      expiryDate: new Date(stock.expiryDate).toLocaleDateString(),
    };
  }

  async findAllOutOfStock(withId: boolean) {
    const stocks = await this.stockRepository.findAll({
      where: {
        packSizeQuantity: {
          [Op.lt]: 2,
        },
      },
    });

    if (withId) return stocks;
    else {
      return await Promise.all(
        stocks.map(async (value) => await this.returnStockWithoutIds(value)),
      );
    }
  }

  async findAllMedicinesStock() {
    const stocks = await this.stockRepository.findAll();

    const medicinesStock = stocks.map(async (value) => {
      const medicine: Medicine = await this.getMedicine(value.MedicineId);
      return {
        ...medicine['dataValues'],
        packSizeQuantity: value.packSizeQuantity,
        issueQuantity: value.issueQuantity,
      };
    });

    return await Promise.all(medicinesStock);
  }

  async findAllMedicinesOutOfStock() {
    const stocks = await this.stockRepository.findAll({
      where: {
        packSizeQuantity: {
          [Op.lt]: 2,
        },
      },
    });

    const medicinesOutOfStock = stocks.map(async (value) => {
      const medicine: Medicine = await this.getMedicine(value.MedicineId);
      return {
        ...medicine['dataValues'],
        packSizeQuantity: value.packSizeQuantity,
        issueQuantity: value.issueQuantity,
      };
    });

    return await Promise.all(medicinesOutOfStock);
  }

  async findAllExpiredStock(withId: boolean) {
    const NOW = new Date();
    const stocks = await this.stockRepository.findAll({
      where: {
        expiryDate: {
          [Op.lt]: NOW,
        },
      },
    });

    if (withId) return stocks;
    return await Promise.all(
      stocks.map(async (value) => await this.returnStockWithoutIds(value)),
    );
  }

  async findAllExpiredMedicine() {
    const NOW = new Date();
    const stocks = await this.stockRepository.findAll({
      where: {
        expiryDate: {
          [Op.lt]: NOW,
        },
      },
    });

    const expiredMedicines = stocks.map(async (value) => {
      const medicine: Medicine = await this.getMedicine(value.MedicineId);
      return {
        ...medicine['dataValues'],
        expiryDate: new Date(value.expiryDate).toLocaleDateString(),
      };
    });

    return await Promise.all(expiredMedicines);
  }

  async findAll(withId: boolean) {
    if (withId) return await this.stockRepository.findAll();
    else {
      const stocks = await this.stockRepository.findAll();

      return await Promise.all(
        stocks.map(async (value) => await this.returnStockWithoutIds(value)),
      );
    }
  }

  async findOne(stockId: string, withId: boolean) {
    if (withId) return this.stockRepository.findByPk(stockId);
    else
      return await this.returnStockWithoutIds(
        await this.stockRepository.findByPk(stockId),
      );
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
