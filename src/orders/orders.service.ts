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

  async checkIfStockIsExpired(medicineId: string) {
    const stock = await this.getStock(medicineId);

    const NOW = new Date();

    if (stock.expiryDate <= NOW) {
      throw new PreconditionFailedException(
        'Attempting to order an expired medicine!',
      );
    }
  }

  async getMedicine(medicineId: string) {
    const medicine = await this.medicineRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    return medicine;
  }

  async getSupplier(supplierId: string) {
    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    return supplier;
  }

  // name getters
  async getMedicineName(medicineId: string) {
    const medicine = await this.getMedicine(medicineId);

    return medicine.name;
  }

  async getSupplierName(supplierId: string) {
    const supplier = await this.getSupplier(supplierId);

    return supplier.name;
  }

  async returnOrderWithoutIds(order: Order) {
    return {
      id: order.id,
      orderQuantity: order.orderQuantity,
      status: order.status,
      medicine: await this.getMedicineName(order.MedicineId),
      supplier: await this.getSupplierName(order.SupplierId),
      orderDate: new Date(order['orderDate']).toLocaleDateString(),
    };
  }

  async create(
    medicineId: string,
    supplierId: string,
    createOrderDto: CreateOrderDto,
  ) {
    await this.getMedicine(medicineId);

    await this.checkIfStockIssueQuantityPriceIsValid(medicineId);
    await this.checkIfStockPackSizePriceIsValid(medicineId);
    await this.checkIfStockIssueUnitPackSizeIsValid(medicineId);
    await this.checkIfStockIsExpired(medicineId);

    await this.getSupplier(supplierId);

    return await this.orderRepository.create({
      ...createOrderDto,
      MedicineId: medicineId,
      SupplierId: supplierId,
    });
  }

  async findAll(withId: boolean, today: boolean) {
    let orders = await this.orderRepository.findAll({
      where: {
        [Op.or]: [
          { status: OrderStatuses.PENDING },
          { status: OrderStatuses.ACTIVE },
          { status: OrderStatuses.DELIVERED },
        ],
      },
    });

    if (withId) return orders;
    else if (today) {
      const TODAY_START = new Date().setHours(0, 0, 0, 0);
      const NOW = new Date();
      orders = await this.orderRepository.findAll({
        where: {
          [Op.or]: [
            { status: OrderStatuses.PENDING },
            { status: OrderStatuses.ACTIVE },
            { status: OrderStatuses.DELIVERED },
          ],
          orderDate: {
            [Op.gt]: TODAY_START,
            [Op.lt]: NOW,
          },
        },
      });
    }

    return await Promise.all(
      orders.map(async (value) => await this.returnOrderWithoutIds(value)),
    );
  }

  async findOneById(orderId: string) {
    const order = await this.orderRepository.findByPk(orderId);

    if (!order) {
      throw new ForbiddenException('Order not found');
    }
    return order;
  }

  async findOne(orderId: string, withId: boolean) {
    const order = await this.findOneById(orderId);

    if (order.status === OrderStatuses.CANCELLED) {
      throw new ForbiddenException('Order is cancelled');
    }

    if (withId) return order;
    else return await this.returnOrderWithoutIds(order);
  }

  findOrderStatus(meta: string) {
    console.warn(meta);
    if (meta === 'create') return [OrderStatuses.PENDING, OrderStatuses.ACTIVE];
    return ORDER_STATUSES;
  }

  async findActiveOrders(withId: boolean) {
    if (withId)
      return await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.ACTIVE,
        },
      });
    else {
      const orders = await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.ACTIVE,
        },
      });

      return await Promise.all(
        orders.map(async (value) => await this.returnOrderWithoutIds(value)),
      );
    }
  }

  async findPendingOrders(withId: boolean) {
    if (withId)
      return await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.PENDING,
        },
      });
    else {
      const orders = await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.PENDING,
        },
      });

      return await Promise.all(
        orders.map(async (value) => await this.returnOrderWithoutIds(value)),
      );
    }
  }

  async findDeliveredOrders(withId: boolean) {
    if (withId)
      return await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.DELIVERED,
        },
      });
    else {
      const orders = await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.DELIVERED,
        },
      });

      return await Promise.all(
        orders.map(async (value) => await this.returnOrderWithoutIds(value)),
      );
    }
  }

  async findCancelledOrders(withId: boolean) {
    if (withId)
      return await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.CANCELLED,
        },
      });
    else {
      const orders = await this.orderRepository.findAll({
        where: {
          status: OrderStatuses.CANCELLED,
        },
      });

      return await Promise.all(
        orders.map(async (value) => await this.returnOrderWithoutIds(value)),
      );
    }
  }

  async update(
    medicineId: string,
    supplierId: string,
    orderId: string,
    updateOrderDto: UpdateOrderDto,
    withId: boolean,
  ) {
    const medicine = await this.medicineRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    const supplier = await this.supplierRepository.findByPk(supplierId);

    if (!supplier) {
      throw new ForbiddenException('Supplier not found');
    }

    await this.checkIfStockIssueQuantityPriceIsValid(medicineId);
    await this.checkIfStockPackSizePriceIsValid(medicineId);
    await this.checkIfStockIssueUnitPackSizeIsValid(medicineId);
    await this.checkIfStockIsExpired(medicineId);

    const order = await this.findOneById(orderId);

    if (withId) return await order.update({ ...updateOrderDto });
    else
      return this.returnOrderWithoutIds(
        await order.update({ ...updateOrderDto }),
      );
  }

  async remove(orderId: string) {
    const order = await this.findOneById(orderId);

    if (order.status === OrderStatuses.CANCELLED) {
      throw new ForbiddenException('Order is already cancelled');
    } else if (order.status === OrderStatuses.DELIVERED) {
      throw new ForbiddenException('Order is already delivered');
    }
    return order.update({ status: OrderStatuses.CANCELLED });
  }
}
