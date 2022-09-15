import { ORDERS_REPOSITORY } from './constants';
import { Order } from './entities';

export const ordersProvider = [
  {
    provide: ORDERS_REPOSITORY,
    useValue: Order,
  },
];
