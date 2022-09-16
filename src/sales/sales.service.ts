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
import { Sequelize } from 'sequelize-typescript';

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

  async getMedicineName(medicineId: string) {
    const medicine = await this.getMedicine(medicineId);

    return medicine.name;
  }

  async getCustomerName(customerId: string) {
    const customer = await this.getCustomer(customerId);

    return customer.name;
  }

  async create(
    // medicineId: string,
    // customerId: string,
    createSaleDto: CreateSaleDto[],
  ) {
    const rowSales: CreateSaleDto[] = Object.values(createSaleDto);

    const sales = rowSales.map(async (value) => {
      const customerId = value.CustomerId;
      const medicineId = value.MedicineId;

      await this.getCustomer(customerId);

      await this.getMedicine(medicineId);

      const stock = await this.getStock(medicineId);

      // update stock
      const newStockIssueQuantity =
        stock.issueQuantity - value.issueUnitQuantity;

      await this.updateStock(medicineId, newStockIssueQuantity);

      // get the medicine price
      const medicinePrice = stock.issueUnitPrice;

      // calculate the total price
      const totalPrice = medicinePrice * value.issueUnitQuantity;

      return {
        ...value,
        issueUnitPrice: medicinePrice,
        totalPrice,
        status: SalesStatus.ISSUED,
      };
    });

    // create the sales
    const createdSales = await this.saleRepository.bulkCreate(
      await Promise.all(sales),
    );

    return await Promise.all(
      createdSales.map(
        async (value) => await this.returnSaleWithoutCustomerId(value),
      ),
    );
  }

  async returnSaleWithoutCustomerId(sale: Sale) {
    // console.warn('sales', );

    const data = sale['dataValues'];
    return {
      id: data.id,
      customer: await this.getCustomerName(data.CustomerId),
      issueUnitQuantity: data.issueUnitQuantity,
      issueUnitPrice: data.issueUnitPrice,
      totalPrice: data.totalPrice,
      status: data.status,
      // medicine: await this.getMedicine(sale.MedicineId),
      medicines: data['medicines'],
      saleDate: data['saleDate'],
    };
  }

  async returnSaleWithoutIds(sale: Sale) {
    const data = sale['dataValues'];

    return {
      id: data.id,
      medicine: await this.getMedicineName(data.MedicineId),
      customer: await this.getCustomerName(data.CustomerId),
      issueUnitQuantity: data.issueUnitQuantity,
      issueUnitPrice: data.issueUnitPrice,
      totalPrice: data.totalPrice,
      status: data.status,
      saleDate: data['saleDate'],
    };
  }

  async findAll(saleDate: Date, customerId: string, withId: boolean) {
    let sales: Sale[];

    if (saleDate) {
      sales = await this.saleRepository.findAll({
        where: {
          [Op.or]: [
            { status: SalesStatus.ISSUED },
            { status: SalesStatus.PENDING },
          ],
          saleDate: saleDate,
        },
        group: ['saleDate'],
        attributes: {
          // exclude: ['MedicineId'],
          include: [[Sequelize.fn('COUNT', 'saleDate'), 'medicines']],
        },
      });
    } else if (customerId) {
      sales = await this.saleRepository.findAll({
        where: {
          [Op.or]: [
            { status: SalesStatus.ISSUED },
            { status: SalesStatus.PENDING },
          ],
          CustomerId: customerId,
        },
        group: ['saleDate'],
        attributes: {
          // exclude: ['MedicineId'],
          include: [[Sequelize.fn('COUNT', 'saleDate'), 'medicines']],
        },
      });
    } else {
      sales = await this.saleRepository.findAll({
        where: {
          [Op.or]: [
            { status: SalesStatus.ISSUED },
            { status: SalesStatus.PENDING },
          ],
        },
        group: ['saleDate'],
        attributes: {
          // exclude: ['MedicineId'],
          include: [[Sequelize.fn('COUNT', 'saleDate'), 'medicines']],
        },
      });
    }

    if (!withId)
      return await Promise.all(
        sales.map(
          async (value) => await this.returnSaleWithoutCustomerId(value),
        ),
      );
    else return sales;
  }

  async findAllIssuedSales(withId: boolean) {
    if (!withId)
      return await this.saleRepository.findAll({
        where: {
          status: SalesStatus.ISSUED,
        },
      });
    else {
      const sales = await this.saleRepository.findAll({
        where: {
          status: SalesStatus.ISSUED,
        },
      });

      return await Promise.all(
        sales.map(
          async (value) => await this.returnSaleWithoutCustomerId(value),
        ),
      );
    }
  }

  async findAllPendingSales(withId: boolean) {
    if (withId)
      return await this.saleRepository.findAll({
        where: {
          status: SalesStatus.PENDING,
        },
      });
    else {
      const sales = await this.saleRepository.findAll({
        where: {
          status: SalesStatus.PENDING,
        },
      });

      return await Promise.all(
        sales.map(
          async (value) => await this.returnSaleWithoutCustomerId(value),
        ),
      );
    }
  }

  async findAllCancelledSales(withId: boolean) {
    if (withId)
      return await this.saleRepository.findAll({
        where: {
          status: SalesStatus.CANCELLED,
        },
      });
    else {
      const sales = await this.saleRepository.findAll({
        where: {
          status: SalesStatus.CANCELLED,
        },
      });

      return await Promise.all(
        sales.map(
          async (value) => await this.returnSaleWithoutCustomerId(value),
        ),
      );
    }
  }

  findSalesStatus() {
    return SALES_STATUS;
  }

  async findOne(salesId: string, withId: boolean) {
    if (withId) return await this.getSale(salesId);
    return await this.returnSaleWithoutIds(await this.getSale(salesId));
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
    const updatedSale = await sale.update({
      ...updateSaleDto,
      issueUnitPrice: medicinePrice,
      totalPrice,
    });

    return await this.returnSaleWithoutIds(updatedSale);
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
