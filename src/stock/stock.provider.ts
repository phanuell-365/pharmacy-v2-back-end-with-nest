import { STOCK_REPOSITORY } from './constants';
import { Stock } from './entities';

export const stockProvider = [
  {
    provide: STOCK_REPOSITORY,
    useValue: Stock,
  },
];
