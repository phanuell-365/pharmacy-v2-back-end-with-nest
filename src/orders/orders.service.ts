import {
  ForbiddenException,
  Inject,
  Injectable,
  PreconditionFailedException,
} from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { ORDER_STATUSES, ORDERS_REPOSITORY } from './constants';
import { Order } from './entities';
import { MEDICINES_REPOSITORY } from '../medicines/constants/medicines.repository';
import { Op } from 'sequelize';
import { STOCK_REPOSITORY } from '../stock/constants';
import { OrderStatuses } from './enum';
import { Supplier } from '../suppliers/entities';
import { SUPPLIERS_REPOSITORY } from '../suppliers/constants';
import { Medicine } from '../medicines/entities';
import { Stock } from '../stock/entities';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(MEDICINES_REPOSITORY)
    private readonly medicineRepository: typeof Medicine,
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly supplierRepository: typeof Supplier,
    @Inject(ORDERS_REPOSITORY)
    private readonly orderRepository: typeof Order,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: typeof Stock,
  ) {}

  async getStock(medicineId: string) {
    const stock = await this.stockRepository.findOne({
      where: {
        MedicineId: medicineId,
      },
    });

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    return stock;
  }

  async checkIfStockIssueQuantityPriceIsValid(medicineId: string) {
    const stock = await this.getStock(medicineId);

    if (stock.issueUnitPrice < 0)
      throw new PreconditionFailedException(
        "The medicine's issue unit price is invalid!",
      );
  }

  async checkIfStockIssueUnitPackSizeIsValid(medicineId: string) {
    const stock = await this.getStock(medicineId);

    if (stock.issueUnitPerPackSize < 0)
      throw new PreconditionFailedException(
        "The medicine's issue unit per pack size is invalid!",
      );
  }

  async checkIfStockPackSizePriceIsValid(medicineId: string) {
    const stock = await this.getStock(medicineId);

    if (stock.packSizePrice < 0)
      throw new PreconditionFailedException(
        "The medicine's pack size price invalid!",
      );
  }

  async create(
    medicineId: string,
    supplierId: string,
    createOrderDto: CreateOrderDto,
  ) {
    const medicine = await this.medicineRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    await this.checkIfStockIssueQuantityPriceIsValid(medicineId);
    await this.checkIfStockPackSizePriceIsValid(medicineId);
    await this.checkIfStockIssueUnitPackSizeIsValid(medicineId);

    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    return await this.orderRepository.create({
      ...createOrderDto,
      MedicineId: medicineId,
      SupplierId: supplierId,
    });
  }

  async findAll() {
    return await this.orderRepository.findAll({
      where: {
        [Op.or]: [
          { status: OrderStatuses.PENDING },
          { status: OrderStatuses.ACTIVE },
          { status: OrderStatuses.DELIVERED },
        ],
      },
    });
  }

  async findOne(orderId: string) {
    const order = await this.orderRepository.findByPk(orderId);

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    if (order.status === OrderStatuses.CANCELLED) {
      throw new ForbiddenException('Order is cancelled');
    }

    return order;
  }

  findOrderStatus() {
    return ORDER_STATUSES;
  }

  async findActiveOrders() {
    return await this.orderRepository.findAll({
      where: {
        status: OrderStatuses.ACTIVE,
      },
    });
  }

  async findPendingOrders() {
    return await this.orderRepository.findAll({
      where: {
        status: OrderStatuses.PENDING,
      },
    });
  }

  async findDeliveredOrders() {
    return await this.orderRepository.findAll({
      where: {
        status: OrderStatuses.DELIVERED,
      },
    });
  }

  async findCancelledOrders() {
    return await this.orderRepository.findAll({
      where: {
        status: OrderStatuses.CANCELLED,
      },
    });
  }

  async update(
    medicineId: string,
    supplierId: string,
    orderId: string,
    updateOrderDto: UpdateOrderDto,
  ) {
    const medicine = await this.medicineRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    const order = await this.findOne(orderId);

    return await order.update({ ...updateOrderDto });
  }

  async remove(orderId: string) {
    const order = await this.findOne(orderId);

    if (order.status === OrderStatuses.CANCELLED) {
      throw new ForbiddenException('Order is already cancelled');
    } else if (order.status === OrderStatuses.DELIVERED) {
      throw new ForbiddenException('Order is already delivered');
    }
    return order.update({ status: OrderStatuses.CANCELLED });
  }
}
