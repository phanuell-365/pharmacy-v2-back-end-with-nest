import { SALES_REPOSITORY } from './constants';
import { Sale } from './entities';

export const salesProvider = [
  {
    provide: SALES_REPOSITORY,
    useValue: Sale,
  },
];
