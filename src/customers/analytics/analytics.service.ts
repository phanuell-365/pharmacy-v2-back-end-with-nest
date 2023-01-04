import { Inject, Injectable } from '@nestjs/common';
import { CustomersService } from '../customers.service';
import { CUSTOMERS_REPOSITORY } from '../constants';
import { Customer } from '../entities';
import { Op } from 'sequelize';
import * as moment from 'moment';
import { CustomerAnalytics } from './interface';

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
          [Op.lt]: end,
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
}
