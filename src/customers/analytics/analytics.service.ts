import { Inject, Injectable } from '@nestjs/common';
import { CustomersService } from '../customers.service';
import { CUSTOMERS_REPOSITORY } from '../constants';
import { Customer } from '../entities';
import { Op } from 'sequelize';
import * as moment from 'moment';
import { CustomerAnalytics, DailyCustomerAnalytics } from './interface';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly customersService: CustomersService,
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: typeof Customer,
  ) {}

  async dailyCustomers(start: Date, end: Date) {
    return await this.customersRepository.findAndCountAll({
      where: {
        createdAt: {
          [Op.gt]: start,
          [Op.lte]: end,
        },
      },
      raw: true,
    });
  }

  async customersToday() {
    const startOfDay = moment().startOf('day');
    const now = moment().add(1, 'minute');

    const { count } = await this.dailyCustomers(
      startOfDay.toDate(),
      now.toDate(),
    );

    const analyticsObj: CustomerAnalytics = {
      date: now.toDate(),
      total: count,
    };

    return analyticsObj;
  }

  async customersWithinRange(start: Date, end: Date) {
    const { count } = await this.dailyCustomers(start, end);

    const analyticsObj: CustomerAnalytics = {
      date: end,
      total: count,
    };

    return analyticsObj;
  }

  async thisWeeklyCustomers() {
    const weekStart = moment().startOf('week');
    const now = moment();
    const someDay = moment().startOf('week').add(1, 'day');

    const weeklyCustomers: DailyCustomerAnalytics[] = [];

    while (weekStart.isSameOrBefore(now)) {
      const start = weekStart.toDate();
      const end = someDay.toDate();

      const { count } = await this.dailyCustomers(start, end);

      weeklyCustomers.push({
        day: moment(start).format('dddd'),
        total: count,
      });

      weekStart.add(1, 'day');
      someDay.add(1, 'day');
    }

    return weeklyCustomers;
  }
}
