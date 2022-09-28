import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { User } from './entities';
import { USERS_REPOSITORY, USERS_ROLES } from './constants';
import { Role } from './enums';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.findOne({
      where: {
        ...createUserDto,
      },
    });

    if (user) {
      throw new ConflictException('User already exists!');
    }

    if (createUserDto.role === Role.ADMIN)
      throw new ForbiddenException(
        'Error! Failed to create user. You can only have one admin',
      );

    const chiefPharmacist = await this.usersRepository.findOne({
      where: {
        role: Role.CHIEF_PHARMACIST,
      },
    });

    if (chiefPharmacist && createUserDto.role === Role.CHIEF_PHARMACIST)
      throw new ForbiddenException(
        'Error! Failed to create user. You can only have one chief pharmacist',
      );

    const salt = await bcrypt.genSalt(10);
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    try {
      return await this.usersRepository.create({
        ...createUserDto,
      });
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findAll() {
    return await this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findByPk(id);

    if (!user) {
      throw new BadRequestException('User not found!');
    }
    return user;
  }

  fetchUsersRoles() {
    return USERS_ROLES;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findByPk(id);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    return await user.update({ ...updateUserDto });
  }

  async remove(id: string) {
    const user = await this.usersRepository.findByPk(id);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return await user.destroy();
  }
}
