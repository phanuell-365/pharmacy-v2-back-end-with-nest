import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Customer } from './entities';
import { CUSTOMERS_REPOSITORY } from './constants';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: typeof Customer,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.customersRepository.findOne({
      where: {
        name: createCustomerDto.name,
      },
    });

    if (customer) {
      throw new ForbiddenException('Customer already exists');
    }

    try {
      return await this.customersRepository.create({ ...createCustomerDto });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError')
        throw new ConflictException(e.errors[0].message);
      throw new ConflictException(e.message);
    }
  }

  async findAll() {
    return await this.customersRepository.findAll();
  }

  async findOne(id: string) {
    const customer = await this.customersRepository.findByPk(id);

    if (!customer) {
      throw new ForbiddenException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customersRepository.findByPk(id);

    if (!customer) {
      throw new ForbiddenException('Customer not found');
    }

    return await customer.update({ ...updateCustomerDto });
  }

  async remove(id: string) {
    const customer = await this.customersRepository.findByPk(id);

    if (!customer) {
      throw new ForbiddenException('Customer not found');
    }

    return await customer.destroy();
  }
}
