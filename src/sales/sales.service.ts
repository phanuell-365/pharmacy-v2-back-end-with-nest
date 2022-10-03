import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { Sale } from './entities';
import { Op } from 'sequelize';
import { SALES_REPOSITORY, SALES_STATUS } from './constants';
import { SalesStatus } from './enums';
import { Customer } from '../customers/entities';
import { CUSTOMERS_REPOSITORY } from '../customers/constants';
import { MEDICINES_REPOSITORY } from '../medicines/constants/medicines.repository';
import { Medicine } from '../medicines/entities';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SalesService {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customerRepository: typeof Customer,
    @Inject(SALES_REPOSITORY) private readonly saleRepository: typeof Sale,
    // @Inject(STOCK_REPOSITORY)
    // private readonly stockRepository: typeof Stock,
    @Inject(MEDICINES_REPOSITORY)
    private readonly medicineRepository: typeof Medicine,
  ) {}

  async getCustomer(customerId: string, paranoid: boolean) {
    const customer = await this.customerRepository.findByPk(customerId, {
      paranoid,
    });

    if (!customer) {
      throw new ForbiddenException('Customer not found');
    }

    return customer;
  }

  async getMedicine(medicineId: string, paranoid: boolean) {
    const medicine = await this.medicineRepository.findByPk(medicineId, {
      paranoid,
    });

    if (!medicine) {
      throw new ForbiddenException('Medicine not found!');
    }

    return medicine;
  }

  //
  // async getStock(medicineId: string) {
  //   const stock = await this.stockRepository.findOne({
  //     where: {
  //       MedicineId: medicineId,
  //     },
  //   });
  //
  //   const medicine = await this.getMedicine(medicineId, true);
  //
  //   if (!stock) {
  //     throw new ForbiddenException('Stock not found');
  //   }
  //
  //   const NOW = new Date();
  //
  //   if (stock.expiryDate <= NOW) {
  //     throw new PreconditionFailedException(
  //       `${medicine.name} has already expired!`,
  //     );
  //   }
  //
  //   return stock;
  // }

  async getSale(salesId: string) {
    const sale = await this.saleRepository.findByPk(salesId);

    if (!sale) {
      throw new ForbiddenException('Sale not found');
    } else if (sale.status === SalesStatus.CANCELLED) {
      throw new ForbiddenException('Sale is cancelled');
    }

    return sale;
  }

  //
  // async updateStock(medicineId: string, newStockIssueQuantity: number) {
  //   const stock = await this.getStock(medicineId);
  //
  //   const medicine = await this.getMedicine(medicineId, true);
  //
  //   if (newStockIssueQuantity < 0) {
  //     throw new ForbiddenException(`${medicine.name} is out of stock!`);
  //   } else if (newStockIssueQuantity === 0) {
  //     throw new ForbiddenException('Stock is equal to new quantity');
  //   }
  //
  //   return await stock.update({
  //     issueQuantity: newStockIssueQuantity,
  //   });
  // }

  async getMedicineName(medicineId: string, paranoid: boolean) {
    const medicine = await this.getMedicine(medicineId, paranoid);

    return medicine.name;
  }

  async getCustomerName(customerId: string, paranoid: boolean) {
    const customer = await this.getCustomer(customerId, paranoid);

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

      await this.getCustomer(customerId, true);

      await this.getMedicine(medicineId, true);
      //
      // const stock = await this.getStock(medicineId);
      //
      // // update stock
      // const newStockIssueQuantity =
      //   stock.issueQuantity - value.issueUnitQuantity;
      //
      // await this.updateStock(medicineId, newStockIssueQuantity);
      //
      // // get the medicine price
      // const medicinePrice = stock.issueUnitPrice;
      //
      // // calculate the total price
      // const totalPrice = medicinePrice * value.issueUnitQuantity;
      //
      // return {
      //   ...value,
      //   issueUnitPrice: medicinePrice,
      //   totalPrice,
      //   status: SalesStatus.ISSUED,
      // };
    });

    // create the sales
    // const createdSales = await this.saleRepository.bulkCreate(
    //   await Promise.all(sales),
    // );
    //
    // return await Promise.all(
    //   createdSales.map(
    //     async (value) => await this.returnSaleWithoutCustomerId(value),
    //   ),
    // );
  }

  async returnSaleWithoutCustomerId(sale: Sale) {
    const data = sale['dataValues'];
    return {
      id: data.id,
      customer: await this.getCustomerName(data.CustomerId, true),
      // issueUnitQuantity: data.issueUnitQuantity,
      // issueUnitPrice: data.issueUnitPrice,
      totalPrices: data['totalPrices'],
      medicines: data['medicines'],
      saleDate: new Date(data['saleDate']).toLocaleDateString(),
    };
  }

  async returnSaleWithoutIds(sale: Sale, paranoid: boolean) {
    const data = sale['dataValues'];

    return {
      id: data.id,
      medicine: await this.getMedicineName(data.MedicineId, paranoid),
      customer: await this.getCustomerName(data.CustomerId, paranoid),
      issueUnitQuantity: data.issueUnitQuantity,
      issueUnitPrice: data.issueUnitPrice,
      totalPrice: data.totalPrice,
      status: data.status,
      saleDate: new Date(data['saleDate']).toLocaleDateString(),
    };
  }

  async findAll(
    saleDate: Date,
    customerId: string,
    withId: boolean,
    today: boolean,
  ) {
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
          include: [
            [Sequelize.fn('COUNT', 'saleDate'), 'medicines'],
            [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'totalPrices'],
          ],
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
    } else if (today) {
      const TODAY_START = new Date().setHours(0, 0, 0, 0);
      const NOW = new Date();

      sales = await this.saleRepository.findAll({
        where: {
          [Op.or]: [
            { status: SalesStatus.ISSUED },
            { status: SalesStatus.PENDING },
          ],
          saleDate: {
            [Op.gt]: TODAY_START,
            [Op.lt]: NOW,
          },
        },
        group: ['saleDate'],
        attributes: {
          // exclude: ['MedicineId'],
          include: [
            [Sequelize.fn('COUNT', 'saleDate'), 'medicines'],
            [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'totalPrices'],
          ],
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
          include: [
            [Sequelize.fn('COUNT', 'saleDate'), 'medicines'],
            [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'totalPrices'],
          ],
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
    if (withId)
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
          async (value) => await this.returnSaleWithoutIds(value, true),
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
          async (value) => await this.returnSaleWithoutIds(value, true),
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
          async (value) => await this.returnSaleWithoutIds(value, false),
        ),
      );
    }
  }

  findSalesStatus() {
    return SALES_STATUS;
  }

  async findOne(salesId: string, withId: boolean) {
    if (withId) return await this.getSale(salesId);
    return await this.returnSaleWithoutIds(await this.getSale(salesId), true);
  }

  async update(
    medicineId: string,
    customerId: string,
    salesId: string,
    updateSaleDto: UpdateSaleDto,
  ) {
    // await this.getCustomer(customerId, true);
    //
    // await this.getMedicine(medicineId, true);
    //
    // const stock = await this.getStock(medicineId);
    //
    // const sale = await this.getSale(salesId);
    //
    // // update stock
    // const newStockIssueQuantity =
    //   stock.issueQuantity +
    //   sale.issueUnitQuantity -
    //   updateSaleDto.issueUnitQuantity;
    //
    // await this.updateStock(medicineId, newStockIssueQuantity);
    //
    // // get the medicine price
    // const medicinePrice = stock.issueUnitPrice;
    //
    // // calculate the total price
    // const totalPrice = medicinePrice * updateSaleDto.issueUnitQuantity;
    //
    // // check if the sales status was changed
    // if (
    //   updateSaleDto.status &&
    //   updateSaleDto.status === SalesStatus.CANCELLED
    // ) {
    //   const previouslySoldQuantity = sale.issueUnitQuantity;
    //   const currentStock = stock.issueQuantity;
    //
    //   const initialStockIssueQuantity = previouslySoldQuantity + currentStock;
    //
    //   await stock.update({
    //     issueQuantity: initialStockIssueQuantity,
    //   });
    // }
    //
    // // update the sale
    // const updatedSale = await sale.update({
    //   ...updateSaleDto,
    //   issueUnitPrice: medicinePrice,
    //   totalPrice,
    // });
    //
    // return await this.returnSaleWithoutIds(updatedSale, true);
  }

  async remove(salesId: string) {
    const sale = await this.getSale(salesId);

    // const stock = await this.getStock(sale.MedicineId);
    //
    // const newStockIssueQuantity = stock.issueQuantity + sale.issueUnitQuantity;
    //
    // await this.updateStock(sale.MedicineId, newStockIssueQuantity);

    // change the sales status to cancelled
    return await sale.update({
      status: SalesStatus.CANCELLED,
    });
  }
}
