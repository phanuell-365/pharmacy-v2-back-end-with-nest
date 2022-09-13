import { CUSTOMERS_REPOSITORY } from "./constants";
import { Customer } from "./entities";

export const customersProvider = [
  {
    provide: CUSTOMERS_REPOSITORY,
    useValue: Customer,
  },
];
