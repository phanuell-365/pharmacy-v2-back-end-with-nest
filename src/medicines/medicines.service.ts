import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateMedicineDto, UpdateMedicineDto } from './dto';
import { MEDICINES_REPOSITORY } from './constants/medicines.repository';
import { Medicine } from './entities';
import { DOSE_FORMS, MEDICINE_STRENGTHS } from './constants';
import { Op } from 'sequelize';

@Injectable()
export class MedicinesService {
  constructor(
    @Inject(MEDICINES_REPOSITORY)
    private readonly medicinesRepository: typeof Medicine,
  ) {}

  async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
    if (
      (await this.medicinesRepository.findOne({
        where: {
          ...createMedicineDto,
        },
      })) ||
      (await this.medicinesRepository.findOne({
        where: {
          name: createMedicineDto.name,
          doseForm: createMedicineDto.doseForm,
          strength: createMedicineDto.strength,
        },
      }))
    ) {
      throw new ConflictException('Medicine already exists!');
    }

    try {
      return await this.medicinesRepository.create({ ...createMedicineDto });
    } catch (e) {
      if (e?.name === 'SequelizeUniqueConstraintError')
        throw new BadRequestException(e?.errors.message);
      console.error(e);

      throw new BadRequestException(e);
    }
  }

  async findAllWithoutStockInfo(): Promise<Medicine[]> {
    return await this.medicinesRepository.findAll({
      attributes: [
        'id',
        'name',
        'doseForm',
        'strength',
        'levelOfUse',
        'therapeuticClass',
        'packSize',
      ],
    });
  }

  async findAll(paranoid: string): Promise<Medicine[]> {
    switch (paranoid) {
      case 'true':
        return await this.medicinesRepository.findAll();
      case 'false':
        return await this.medicinesRepository.findAll({ paranoid: false });
    }
  }

  async findOneWithoutStockInfo(id: string) {
    const medicine = await this.medicinesRepository.findByPk(id, {
      attributes: [
        'id',
        'name',
        'doseForm',
        'strength',
        'levelOfUse',
        'therapeuticClass',
        'packSize',
      ],
    });

    if (!medicine) {
      throw new ForbiddenException('Medicine not found!');
    }

    return medicine;
  }

  async findOne(id: string, paranoid: string): Promise<Medicine> {
    let medicine: Medicine;

    switch (paranoid) {
      case 'true':
        medicine = await this.medicinesRepository.findByPk(id, {
          paranoid: true,
        });
        break;
      case 'false':
        medicine = await this.medicinesRepository.findByPk(id, {
          paranoid: false,
        });
        break;
      default:
        medicine = await this.medicinesRepository.findByPk(id);
    }

    if (!medicine) {
      throw new ForbiddenException('Medicine not found!');
    }

    return medicine;
  }

  async findAllMedicineOutOfStock(paranoid: string) {
    switch (paranoid) {
      case 'true':
        return await this.medicinesRepository.findAll({
          where: {
            packSizeQuantity: {
              [Op.lt]: 2,
            },
          },
        });
      case 'false':
        return await this.medicinesRepository.findAll({
          where: {
            packSizeQuantity: {
              [Op.lt]: 2,
            },
          },
          paranoid: false,
        });
      default:
        return await this.medicinesRepository.findAll({
          where: {
            packSizeQuantity: {
              [Op.lt]: 2,
            },
          },
        });
    }
  }

  async findAllExpiredMedicines(paranoid: string) {
    const NOW = new Date();
    switch (paranoid) {
      case 'true':
        return await this.medicinesRepository.findAll({
          where: {
            expiryDate: {
              [Op.lt]: NOW,
            },
          },
        });
      case 'false':
        return await this.medicinesRepository.findAll({
          where: {
            expiryDate: {
              [Op.lt]: NOW,
            },
          },
          paranoid: false,
        });
      default:
        return await this.medicinesRepository.findAll({
          where: {
            expiryDate: {
              [Op.lt]: NOW,
            },
          },
        });
    }
  }

  findMedicineStrengths() {
    return MEDICINE_STRENGTHS;
  }

  findMedicineDoseForms() {
    return DOSE_FORMS;
  }

  async update(
    id: string,
    updateMedicineDto: UpdateMedicineDto,
  ): Promise<Medicine> {
    const medicine = await this.medicinesRepository.findByPk(id);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found!');
    }

    let existingMedicine: Medicine;

    if (
      updateMedicineDto.name &&
      updateMedicineDto.doseForm &&
      updateMedicineDto.strength
    ) {
      existingMedicine = await this.medicinesRepository.findOne({
        where: {
          name: updateMedicineDto.name,
          doseForm: updateMedicineDto.doseForm,
          strength: updateMedicineDto.strength,
        },
      });
    }

    if (updateMedicineDto.name) {
      const someMedicine = await this.medicinesRepository.findByPk(id);

      existingMedicine = await this.medicinesRepository.findOne({
        where: {
          name: updateMedicineDto.name,
          doseForm: someMedicine.doseForm,
          strength: someMedicine.strength,
        },
      });
    }

    if (updateMedicineDto.doseForm) {
      const someMedicine = await this.medicinesRepository.findByPk(id);

      existingMedicine = await this.medicinesRepository.findOne({
        where: {
          name: someMedicine.name,
          doseForm: updateMedicineDto.doseForm,
          strength: someMedicine.strength,
        },
      });
    }

    if (updateMedicineDto.strength) {
      const someMedicine = await this.medicinesRepository.findByPk(id);

      existingMedicine = await this.medicinesRepository.findOne({
        where: {
          name: someMedicine.name,
          doseForm: someMedicine.doseForm,
          strength: updateMedicineDto.strength,
        },
      });
    }

    if (existingMedicine && existingMedicine.id !== id) {
      throw new ConflictException(
        'Medicine with given credentials already exists!',
      );
    }

    return await medicine.update({ ...updateMedicineDto });
  }

  async remove(id: string) {
    const medicine = await this.medicinesRepository.findByPk(id);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found!');
    }

    return await medicine.destroy();
  }
}
