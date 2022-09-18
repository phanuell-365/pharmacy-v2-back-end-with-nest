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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { OrderStatuses } from './enum';
import { Role } from '../users/enums';
import { JwtGuard } from '../auth/guards';
import { Roles } from '../auth/decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  create(
    @Body('MedicineId') medicineId: string,
    @Body('SupplierId') supplierId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(medicineId, supplierId, createOrderDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  findAll(
    @Query('status') status: string,
    @Query('resource') resource: string,
    @Query('meta') meta: string,
    @Query('withId') withId: boolean,
    @Query('today') today: boolean,
  ) {
    if (status === OrderStatuses.PENDING) {
      return this.ordersService.findPendingOrders(withId);
    } else if (status === OrderStatuses.DELIVERED) {
      return this.ordersService.findDeliveredOrders(withId);
    } else if (status === OrderStatuses.CANCELLED) {
      return this.ordersService.findCancelledOrders(withId);
    } else if (status === OrderStatuses.ACTIVE) {
      return this.ordersService.findActiveOrders(withId);
    } else if (resource && resource === 'status') {
      return this.ordersService.findOrderStatus(meta);
    } else {
      return this.ordersService.findAll(withId, today);
    }
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  findOne(@Query('withId') withId: boolean, @Param('id') orderId: string) {
    return this.ordersService.findOne(orderId, withId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  update(
    @Param('id') orderId: string,
    @Body('MedicineId') medicineId: string,
    @Body('SupplierId') supplierId: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Query('withId') withId: boolean,
  ) {
    return this.ordersService.update(
      medicineId,
      supplierId,
      orderId,
      updateOrderDto,
      withId,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  remove(@Param('id') orderId: string) {
    return this.ordersService.remove(orderId);
  }
}
