import { MEDICINES_REPOSITORY } from './constants/medicines.repository';
import { Medicine } from './entities';

export const medicinesProvider = [
  {
    provide: MEDICINES_REPOSITORY,
    useValue: Medicine,
  },
];
