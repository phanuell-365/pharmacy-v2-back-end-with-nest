import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator';
import { Role } from './enums';

@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(
    Role.ADMIN,
    Role.CHIEF_PHARMACIST,
    Role.PHARMACIST,
    Role.PHARMACIST_ASSISTANT,
    Role.PHARMACY_TECHNICIAN,
  )
  @Get('search')
  findResource(@Query('resource') resource: string) {
    if (resource && resource === 'roles') {
      return this.usersService.fetchUsersRoles();
    }
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.CHIEF_PHARMACIST,
    Role.PHARMACIST,
    Role.PHARMACIST_ASSISTANT,
    Role.PHARMACY_TECHNICIAN,
  )
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN,
    Role.CHIEF_PHARMACIST,
    Role.PHARMACIST,
    Role.PHARMACIST_ASSISTANT,
    Role.PHARMACY_TECHNICIAN,
  )
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
