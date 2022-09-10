import { USER_REPOSITORY } from './constants';
import { User } from './entities';

export const usersProvider = [
  {
    provide: USER_REPOSITORY,
    useValue: User,
  },
];
