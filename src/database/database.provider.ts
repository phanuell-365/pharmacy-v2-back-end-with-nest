import { DEVELOPMENT, PRODUCTION, SEQUELIZE, TEST } from './constants';
import { databaseConfig } from './database.config';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../users/entities';
import { InternalServerErrorException } from '@nestjs/common';
import { Customer } from '../customers/entities';
import { Medicine } from '../medicines/entities';
import { Supplier } from '../suppliers/entities';
import { Order } from '../orders/entities';
import { Purchase } from '../purchases/entities';
import { Sale } from '../sales/entities';

export const databaseProvider = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;

      switch (process.env.NODE_ENV) {
        case TEST:
          config = databaseConfig.test;
          break;
        case DEVELOPMENT:
          config = databaseConfig.development;
          break;
        case PRODUCTION:
          config = databaseConfig.production;
          break;
        default:
          config = databaseConfig.development;
      }

      const sequelize = new Sequelize(config);
      sequelize.addModels([
        User,
        Customer,
        Medicine,
        Supplier,
        // Stock,
        Order,
        Purchase,
        Sale,
      ]);

      try {
        switch (process.env.NODE_ENV) {
          case TEST:
            await sequelize.sync({ force: true });
            break;
          case DEVELOPMENT:
            await sequelize.sync();
            break;
          case PRODUCTION:
            await sequelize.sync();
            break;
          default:
            await sequelize.sync();
        }
      } catch (error) {
        console.error(error.message);
        throw new InternalServerErrorException('Error while syncing database');
      }

      return sequelize;
    },
  },
];
