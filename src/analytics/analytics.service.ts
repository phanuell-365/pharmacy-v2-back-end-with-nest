import { Inject, Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { PurchasesService } from '../purchases/purchases.service';
import { SalesService } from '../sales/sales.service';
import { OrdersService } from '../orders/orders.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { MedicinesService } from '../medicines/medicines.service';
import * as moment from 'moment';
import {
  OrdersMonthlyDailyReport,
  PurchasesMonthlyDailyReport,
  SalesMonthlyDailyReport,
} from './interface';
import { SalesStatus } from '../sales/enums';
import { Op } from 'sequelize';
import { Sale } from '../sales/entities';
import { SALES_REPOSITORY } from '../sales/constants';
import { PURCHASES_REPOSITORY } from '../purchases/constants';
import { Purchase } from '../purchases/entities';
import { OrderStatuses } from '../orders/enum';
import { ORDERS_REPOSITORY } from '../orders/constants';
import { Order } from '../orders/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(SALES_REPOSITORY) private readonly salesRepository: typeof Sale,
    @Inject(PURCHASES_REPOSITORY)
    private readonly purchasesRepository: typeof Purchase,
    @Inject(ORDERS_REPOSITORY) private readonly ordersRepository: typeof Order,
    private readonly ordersService: OrdersService,
    private readonly salesService: SalesService,
    private readonly medicinesService: MedicinesService,
    private readonly purchasesService: PurchasesService,
    private readonly customersService: CustomersService,
    private readonly suppliersService: SuppliersService,
  ) {}

  // medicine's analytics

  // customer's analytics

  // supplier's analytics

  // order's analytics

  /**
   * @description Can be used to get delivered, pending and active orders.
   * @param dayStart The date to start querying for the day's orders
   * @param dayEnd The date to stop querying for the day's orders
   */
  async getDailyOrders(dayStart: Date, dayEnd: Date) {
    return await this.ordersRepository.findAll({
      where: {
        [Op.or]: [
          { status: OrderStatuses.PENDING },
          { status: OrderStatuses.ACTIVE },
          { status: OrderStatuses.DELIVERED },
        ],
        orderDate: {
          [Op.gt]: dayStart,
          [Op.lt]: dayEnd,
        },
      },
    });
  }

  /**
   * @description Can be used to get delivered, pending, active and cancelled orders.
   * @param dayStart The date to start querying for the day's orders
   * @param dayEnd The date to stop querying for the day's orders
   * @param orderStatus The category of the order, for example orderStatus=cancelled queries for cancelled order
   */
  async getDailyOrdersCategory(
    dayStart: Date,
    dayEnd: Date,
    orderStatus: OrderStatuses,
  ) {
    let orders: Order[] = [];
    if (
      orderStatus !== OrderStatuses.DELIVERED &&
      orderStatus !== OrderStatuses.CANCELLED
    )
      orders = await this.ordersRepository.findAll({
        where: {
          status: orderStatus,
          orderDate: {
            [Op.gt]: dayStart,
            [Op.lt]: dayEnd,
          },
        },
      });

    if (orders.length > 0) return orders;
    return await this.ordersRepository.findAll({
      where: {
        status: orderStatus,
        updatedAt: {
          [Op.gt]: dayStart,
          [Op.lt]: dayEnd,
        },
      },
    });
  }

  async getDailyOrdersReportObj(orders: Order[], orderDate: Date) {
    return {
      orderDate,
      numberOfOrders: orders.length,
    } as OrdersMonthlyDailyReport;
  }

  async currentMonthOrderReport() {
    const TODAY = moment();

    const firstDayOfTheMonth = moment().startOf('month');
    const secondDayOfTheMonth = moment().startOf('month').add(1, 'day');

    const monthlyDailyOrderReport: OrdersMonthlyDailyReport[] = [];

    while (firstDayOfTheMonth.toDate() <= TODAY.toDate()) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyOrderReport.push(
        await this.getDailyOrdersReportObj(
          await this.getDailyOrders(DAY_START, DAY_END),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyOrderReport;
  }

  async currentMonthOrderCategoryReport(orderStatus: OrderStatuses) {
    const TODAY = moment();

    const firstDayOfTheMonth = moment().startOf('month');
    const secondDayOfTheMonth = moment().startOf('month').add(1, 'day');

    const monthlyDailyOrderReport: OrdersMonthlyDailyReport[] = [];

    while (firstDayOfTheMonth.toDate() <= TODAY.toDate()) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyOrderReport.push(
        await this.getDailyOrdersReportObj(
          await this.getDailyOrdersCategory(DAY_START, DAY_END, orderStatus),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyOrderReport;
  }

  async monthDailyOrdersReport(
    month: string | number = new Date().getMonth(),
    year: number = new Date().getFullYear(),
  ) {
    const firstDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month');
    const secondDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month')
      .add(1, 'day');
    const lastDayOfTheMonth = moment().year(year).month(month).endOf('month');

    const monthlyDailyOrderReport: OrdersMonthlyDailyReport[] = [];

    while (
      firstDayOfTheMonth.toDate().getTime() <=
      lastDayOfTheMonth.toDate().getTime()
    ) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyOrderReport.push(
        await this.getDailyOrdersReportObj(
          await this.getDailyOrders(DAY_START, DAY_END),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyOrderReport;
  }

  async monthDailyOrdersCategoryReport(
    month: string | number = new Date().getMonth(),
    orderStatus: OrderStatuses,
    year: number = new Date().getFullYear(),
  ) {
    const firstDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month');
    const secondDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month')
      .add(1, 'day');
    const lastDayOfTheMonth = moment().year(year).month(month).endOf('month');

    const monthlyDailyOrderReport: OrdersMonthlyDailyReport[] = [];

    while (
      firstDayOfTheMonth.toDate().getTime() <=
      lastDayOfTheMonth.toDate().getTime()
    ) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyOrderReport.push(
        await this.getDailyOrdersReportObj(
          await this.getDailyOrdersCategory(DAY_START, DAY_END, orderStatus),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyOrderReport;
  }

  async yearlyMonthlyOrdersReport(year: number = new Date().getFullYear()) {
    const yearlyMonthlyOrdersArray: OrdersMonthlyDailyReport[][] = [];
    yearlyMonthlyOrdersArray.length = 12;

    // get the report for all the months in the year
    for (let m = 0; m < yearlyMonthlyOrdersArray.length; m++) {
      let monthlyDailyReport = yearlyMonthlyOrdersArray[m];

      monthlyDailyReport = await this.monthDailyOrdersReport(m, year);

      yearlyMonthlyOrdersArray[m] = [...monthlyDailyReport];
    }

    return yearlyMonthlyOrdersArray.map((value, index) => {
      return {
        month: moment().month(index).format('MMMM'),
        numberOfOrders: value
          .map((value1) => value1.numberOfOrders)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
      };
    });
  }

  async yearlyMonthlyOrdersCategoryReport(
    year: number = new Date().getFullYear(),
    orderStatus: OrderStatuses,
  ) {
    const yearlyMonthlyOrdersArray: OrdersMonthlyDailyReport[][] = [];
    yearlyMonthlyOrdersArray.length = 12;

    // get the report for all the months in the year
    for (let m = 0; m < yearlyMonthlyOrdersArray.length; m++) {
      let monthlyDailyReport = yearlyMonthlyOrdersArray[m];

      monthlyDailyReport = await this.monthDailyOrdersCategoryReport(
        m,
        orderStatus,
        year,
      );

      yearlyMonthlyOrdersArray[m] = [...monthlyDailyReport];
    }

    return yearlyMonthlyOrdersArray.map((value, index) => {
      return {
        month: moment().month(index).format('MMMM'),
        numberOfOrders: value
          .map((value1) => value1.numberOfOrders)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
      };
    });
  }

  // purchases analytics

  async getDailyPurchases(dayStart: Date, dayEnd: Date) {
    return await this.purchasesRepository.findAll({
      paranoid: false,
      where: {
        purchaseDate: {
          [Op.gt]: dayStart,
          [Op.lt]: dayEnd,
        },
      },
    });
  }

  async getDailyPurchasesReportObj(purchases: Purchase[], purchaseDate: Date) {
    const totalDailyPurchasesAmount = purchases.map(
      (value) => value.totalPurchasePrice,
    );

    let totalAmountSpent: number;

    if (totalDailyPurchasesAmount.length > 0)
      totalAmountSpent = <number>(
        totalDailyPurchasesAmount.reduce(
          (previousValue, currentValue) => +previousValue + +currentValue,
        )
      );
    else totalAmountSpent = 0;

    const numberOfPurchases = purchases.length;

    return {
      purchaseDate,
      totalAmountSpent,
      numberOfPurchases,
    } as PurchasesMonthlyDailyReport;
  }

  /**
   * @description Generates the current month's daily report/analysis
   */
  async currentMonthlyDailyPurchasesReport() {
    const TODAY = moment();

    const firstDayOfTheMonth = moment().startOf('month');
    const secondDayOfTheMonth = moment().startOf('month').add(1, 'day');

    const monthlyDailyPurchasesReport: PurchasesMonthlyDailyReport[] = [];

    while (firstDayOfTheMonth.toDate() <= TODAY.toDate()) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyPurchasesReport.push(
        await this.getDailyPurchasesReportObj(
          await this.getDailyPurchases(DAY_START, DAY_END),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyPurchasesReport;
  }

  async monthDailyPurchasesReport(
    month: string | number = new Date().getMonth(),
    year: number = new Date().getFullYear(),
  ) {
    const firstDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month');
    const secondDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month')
      .add(1, 'day');
    const lastDayOfTheMonth = moment().year(year).month(month).endOf('month');

    const monthlyDailyPurchasesReport: PurchasesMonthlyDailyReport[] = [];

    while (
      firstDayOfTheMonth.toDate().getTime() <=
      lastDayOfTheMonth.toDate().getTime()
    ) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      monthlyDailyPurchasesReport.push(
        await this.getDailyPurchasesReportObj(
          await this.getDailyPurchases(DAY_START, DAY_END),
          firstDayOfTheMonth.toDate(),
        ),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailyPurchasesReport;
  }

  async yearlyMonthlyPurchasesReport(year: number = new Date().getFullYear()) {
    const yearlyMonthlyPurchasesArray: PurchasesMonthlyDailyReport[][] = [];
    yearlyMonthlyPurchasesArray.length = 12;

    // get the report for all the months in the year
    for (let m = 0; m < yearlyMonthlyPurchasesArray.length; m++) {
      let monthlyDailyReport = yearlyMonthlyPurchasesArray[m];

      monthlyDailyReport = await this.monthDailyPurchasesReport(m, year);

      yearlyMonthlyPurchasesArray[m] = [...monthlyDailyReport];
    }

    return yearlyMonthlyPurchasesArray.map((value, index) => {
      return {
        month: moment().month(index).format('MMMM'),
        numberOfPurchases: value
          .map((value1) => value1.numberOfPurchases)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
        totalAmountSpent: value
          .map((value1) => value1.totalAmountSpent)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
      };
    });
  }

  // sales' analytics

  async getDailySale(dayStart: Date, dayEnd: Date) {
    return await this.salesRepository.findAll({
      where: {
        [Op.or]: [
          { status: SalesStatus.ISSUED },
          { status: SalesStatus.PENDING },
        ],
        saleDate: {
          [Op.gt]: dayStart,
          [Op.lt]: dayEnd,
        },
      },
    });
  }

  async getDailySalesReportObj(sales: Sale[], saleDate: Date) {
    const totalDailySalesAmount = sales.map((value) => value.totalPrice);

    let totalSalesAmount: number;
    if (totalDailySalesAmount.length > 0)
      totalSalesAmount = totalDailySalesAmount.reduce(
        (previousValue, currentValue) => previousValue + currentValue,
      );
    else totalSalesAmount = 0;

    const numberOfSales = sales.length;

    return {
      saleDate,
      numberOfSales,
      totalAmount: totalSalesAmount,
    } as SalesMonthlyDailyReport;
  }

  /**
   * @description Generates the current month's daily report/analysis.
   */
  async currentMonthDailySalesReport() {
    const TODAY = moment();

    const firstDayOfTheMonth = moment().startOf('month');
    const secondDayOfTheMonth = moment().startOf('month').add(1, 'day');

    const monthlyDailySalesReport: SalesMonthlyDailyReport[] = [];

    while (firstDayOfTheMonth.toDate() <= TODAY.toDate()) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      const sales = await this.getDailySale(DAY_START, DAY_END);

      monthlyDailySalesReport.push(
        await this.getDailySalesReportObj(sales, firstDayOfTheMonth.toDate()),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthlyDailySalesReport;
  }

  async monthDailySalesReport(
    month: string | number = new Date().getMonth(),
    year: number = new Date().getFullYear(),
  ) {
    const firstDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month');
    const secondDayOfTheMonth = moment()
      .year(year)
      .month(month)
      .startOf('month')
      .add(1, 'day');
    const lastDayOfTheMonth = moment().year(year).month(month).endOf('month');

    const monthDailySalesReport: SalesMonthlyDailyReport[] = [];

    while (
      firstDayOfTheMonth.toDate().getTime() <=
      lastDayOfTheMonth.toDate().getTime()
    ) {
      const DAY_START = firstDayOfTheMonth.toDate();
      const DAY_END = secondDayOfTheMonth.toDate();

      const sales = await this.getDailySale(DAY_START, DAY_END);

      monthDailySalesReport.push(
        await this.getDailySalesReportObj(sales, firstDayOfTheMonth.toDate()),
      );

      firstDayOfTheMonth.add(1, 'day');
      secondDayOfTheMonth.add(1, 'day');
    }

    return monthDailySalesReport;
  }

  async yearlyMonthlySalesReport(year: number = new Date().getFullYear()) {
    const yearlyMonthlySalesArray: SalesMonthlyDailyReport[][] = [];
    yearlyMonthlySalesArray.length = 12;

    // get the report for all the months in the year
    for (let m = 0; m < yearlyMonthlySalesArray.length; m++) {
      let monthlyDailyReport = yearlyMonthlySalesArray[m];

      monthlyDailyReport = await this.monthDailySalesReport(m, year);

      yearlyMonthlySalesArray[m] = [...monthlyDailyReport];
    }

    return yearlyMonthlySalesArray.map((value, index) => {
      return {
        month: moment().month(index).format('MMMM'),
        numberOfSales: value
          .map((value1) => value1.numberOfSales)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
        totalAmount: value
          .map((value1) => value1.totalAmount)
          .reduce(
            (previousValue, currentValue) => +previousValue + +currentValue,
          ),
      };
    });
  }
}
