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
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { Role } from '../users/enums';
import { JwtGuard } from '../auth/guards';
import { Roles } from '../auth/decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
