import { SUPPLIERS_REPOSITORY } from './constants';
import { Supplier } from './entities';

export const suppliersProvider = [
  {
    provide: SUPPLIERS_REPOSITORY,
    useValue: Supplier,
  },
];
