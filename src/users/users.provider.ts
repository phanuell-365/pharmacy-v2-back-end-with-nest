import { USERS_REPOSITORY } from './constants';
import { User } from './entities';

export const usersProvider = [
  {
    provide: USERS_REPOSITORY,
    useValue: User,
  },
];
