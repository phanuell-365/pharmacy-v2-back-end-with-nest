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
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto';
import { Role } from '../users/enums';
import { JwtGuard } from '../auth/guards';
import { Roles } from '../auth/decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  create(@Body() createMedicineDto: CreateMedicineDto) {
    return this.medicinesService.create(createMedicineDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  findAll(@Query('resource') resource: string) {
    switch (resource) {
      case 'strengths':
        return this.medicinesService.findMedicineStrengths();
      case 'doseForms':
        return this.medicinesService.findMedicineDoseForms();
    }
    return this.medicinesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  findOne(@Param('id') id: string) {
    return this.medicinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
  ) {
    return this.medicinesService.update(id, updateMedicineDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicinesService.remove(id);
  }
}
