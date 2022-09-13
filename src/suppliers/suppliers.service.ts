import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { SUPPLIERS_REPOSITORY } from './constants';
import { Supplier } from './entities';

@Injectable()
export class SuppliersService {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: typeof Supplier,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = await this.suppliersRepository.findOne({
      where: {
        name: createSupplierDto.name,
      },
    });

    if (supplier) {
      throw new ForbiddenException('Supplier already exists');
    }

    return await this.suppliersRepository.create({ ...createSupplierDto });
  }

  async findAll() {
    return await this.suppliersRepository.findAll();
  }

  async findOne(id: string) {
    const supplier = await this.suppliersRepository.findByPk(id);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.suppliersRepository.findByPk(id);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    return await supplier.update({ ...updateSupplierDto });
  }

  async remove(id: string) {
    const supplier = await this.suppliersRepository.findByPk(id);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    return await supplier.destroy();
  }
}
