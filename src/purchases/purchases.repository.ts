import { PURCHASES_REPOSITORY } from './constants';
import { Purchase } from './entities';

export const purchasesRepository = [
  {
    provide: PURCHASES_REPOSITORY,
    useValue: Purchase,
  },
];
