import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { Sale } from './entities';
import { Op } from 'sequelize';
import { SALES_REPOSITORY, SALES_STATUS } from './constants';
import { SalesStatus } from './enums';
import { Stock } from '../stock/entities';
import { Customer } from '../customers/entities';
import { CUSTOMERS_REPOSITORY } from '../customers/constants';
import { STOCK_REPOSITORY } from '../stock/constants';
import { MEDICINES_REPOSITORY } from '../medicines/constants/medicines.repository';
import { Medicine } from '../medicines/entities';

@Injectable()
export class SalesService {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customerRepository: typeof Customer,
    @Inject(SALES_REPOSITORY) private readonly saleRepository: typeof Sale,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: typeof Stock,
    @Inject(MEDICINES_REPOSITORY)
    private readonly medicineRepository: typeof Medicine,
  ) {}

  async getCustomer(customerId: string) {
    const customer = await this.customerRepository.findByPk(customerId);

    if (!customer) {
      throw new ForbiddenException('Customer not found');
    }

    return customer;
  }

  async getMedicine(medicineId: string) {
    const medicine = await this.medicineRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    return medicine;
  }

  async getStock(medicineId: string) {
    const stock = await this.stockRepository.findOne({
      where: {
        MedicineId: medicineId,
      },
    });

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    return stock;
  }

  async getSale(salesId: string) {
    const sale = await this.saleRepository.findByPk(salesId);

    if (!sale) {
      throw new ForbiddenException('Sale not found');
    } else if (sale.status === SalesStatus.CANCELLED) {
      throw new ForbiddenException('Sale is cancelled');
    }

    return sale;
  }

  async updateStock(medicineId: string, newStockIssueQuantity: number) {
    const stock = await this.getStock(medicineId);

    // if (stock.issueQuantity < newStockIssueQuantity) {
    //   throw new ForbiddenException('Stock is insufficient');
    // } else if (stock.issueQuantity === newStockIssueQuantity) {
    //   throw new ForbiddenException('Stock is equal to new quantity');
    // }

    if (newStockIssueQuantity < 0) {
      throw new ForbiddenException('Stock is insufficient');
    } else if (newStockIssueQuantity === 0) {
      throw new ForbiddenException('Stock is equal to new quantity');
    }

    return await stock.update({
      issueQuantity: newStockIssueQuantity,
    });
  }

  async create(
    medicineId: string,
    customerId: string,
    createSaleDto: CreateSaleDto,
  ) {
    await this.getCustomer(customerId);

    await this.getMedicine(medicineId);

    const stock = await this.getStock(medicineId);

    // update stock
    const newStockIssueQuantity =
      stock.issueQuantity - createSaleDto.issueUnitQuantity;

    await this.updateStock(medicineId, newStockIssueQuantity);

    // get the medicine price
    const medicinePrice = stock.issueUnitPrice;

    // calculate the total price
    const totalPrice = medicinePrice * createSaleDto.issueUnitQuantity;

    // create the sale
    return await this.saleRepository.create({
      ...createSaleDto,
      issueUnitPrice: medicinePrice,
      totalPrice,
      status: SalesStatus.ISSUED,
    });
  }

  async findAll() {
    return await this.saleRepository.findAll({
      where: {
        [Op.or]: [
          { status: SalesStatus.ISSUED },
          { status: SalesStatus.PENDING },
        ],
      },
    });
  }

  async findAllIssuedSales() {
    return await this.saleRepository.findAll({
      where: {
        status: SalesStatus.ISSUED,
      },
    });
  }

  async findAllPendingSales() {
    return await this.saleRepository.findAll({
      where: {
        status: SalesStatus.PENDING,
      },
    });
  }

  async findAllCancelledSales() {
    return await this.saleRepository.findAll({
      where: {
        status: SalesStatus.CANCELLED,
      },
    });
  }

  findSalesStatus() {
    return SALES_STATUS;
  }

  async findOne(salesId: string) {
    return await this.getSale(salesId);
  }

  async update(
    medicineId: string,
    customerId: string,
    salesId: string,
    updateSaleDto: UpdateSaleDto,
  ) {
    await this.getCustomer(customerId);

    await this.getMedicine(medicineId);

    const stock = await this.getStock(medicineId);

    const sale = await this.getSale(salesId);

    // update stock
    const newStockIssueQuantity =
      stock.issueQuantity +
      sale.issueUnitQuantity -
      updateSaleDto.issueUnitQuantity;

    await this.updateStock(medicineId, newStockIssueQuantity);

    // get the medicine price
    const medicinePrice = stock.issueUnitPrice;

    // calculate the total price
    const totalPrice = medicinePrice * updateSaleDto.issueUnitQuantity;

    // check if the sales status was changed
    if (
      updateSaleDto.status &&
      updateSaleDto.status === SalesStatus.CANCELLED
    ) {
      const previouslySoldQuantity = sale.issueUnitQuantity;
      const currentStock = stock.issueQuantity;

      const initialStockIssueQuantity = previouslySoldQuantity + currentStock;

      await stock.update({
        issueQuantity: initialStockIssueQuantity,
      });
    }
    // update the sale
    return await sale.update({
      ...updateSaleDto,
      issueUnitPrice: medicinePrice,
      totalPrice,
    });
  }

  async remove(salesId: string) {
    const sale = await this.getSale(salesId);

    const stock = await this.getStock(sale.MedicineId);

    const newStockIssueQuantity = stock.issueQuantity + sale.issueUnitQuantity;

    await this.updateStock(sale.MedicineId, newStockIssueQuantity);

    // change the sales status to cancelled
    return await sale.update({
      status: SalesStatus.CANCELLED,
    });
  }
}
