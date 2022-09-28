import {
  ForbiddenException,
  Inject,
  Injectable,
  PreconditionFailedException,
} from '@nestjs/common';
import { Order } from '../orders/entities';
import { OrderStatuses } from '../orders/enum';
import { PURCHASES_REPOSITORY } from './constants';
import { ORDERS_REPOSITORY } from '../orders/constants';
import { STOCK_REPOSITORY } from '../stock/constants';
import { Purchase } from './entities';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto';
import { Stock } from '../stock/entities';
import { MEDICINES_REPOSITORY } from '../medicines/constants/medicines.repository';
import { Medicine } from '../medicines/entities';
import { SUPPLIERS_REPOSITORY } from '../suppliers/constants';
import { Supplier } from '../suppliers/entities';
import { Op } from 'sequelize';

@Injectable()
export class PurchasesService {
  constructor(
    @Inject(PURCHASES_REPOSITORY)
    private readonly purchaseRepository: typeof Purchase,
    @Inject(ORDERS_REPOSITORY)
    private readonly orderRepository: typeof Order,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: typeof Stock,
    @Inject(MEDICINES_REPOSITORY)
    private readonly medicinesRepository: typeof Medicine,
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: typeof Supplier,
  ) {}

  // utility functions

  async getOrder(orderId: string) {
    const order = await this.orderRepository.findByPk(orderId);

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    if (order.status === OrderStatuses.CANCELLED) {
      throw new ForbiddenException('Order was cancelled');
    }

    if (order.status === OrderStatuses.DELIVERED) {
      throw new ForbiddenException('Order was delivered');
    }

    return order;
  }

  async getStock(medicineId: string) {
    const stock = await this.stockRepository.findOne({
      where: {
        MedicineId: medicineId,
      },
    });

    if (!stock) {
      throw new ForbiddenException('Stock not found');
    }

    const NOW = new Date();

    if (stock.expirationDate <= NOW) {
      throw new PreconditionFailedException(
        'Attempt to purchase an expired medicine!',
      );
    }

    return stock;
  }

  async getPurchase(purchaseId: string) {
    const purchase = await this.purchaseRepository.findByPk(purchaseId);

    if (!purchase) {
      throw new ForbiddenException('Purchase not found');
    }

    return purchase;
  }

  async getMedicine(medicineId: string) {
    const medicine = await this.medicinesRepository.findByPk(medicineId);

    if (!medicine) {
      throw new ForbiddenException('Medicine not found');
    }

    return medicine;
  }

  async getSupplier(supplierId: string) {
    const supplier = await this.suppliersRepository.findByPk(supplierId);

    if (!supplier) throw new ForbiddenException('Supplier not found!');

    return supplier;
  }

  getNewOrderQuantity(pending: number, supplied: number) {
    const newOrderQuantity = pending - supplied;

    if (newOrderQuantity < 0) {
      throw new ForbiddenException(
        'Supplied quantity is greater than order quantity',
      );
    }

    return newOrderQuantity;
  }

  async updateOrderQuantity(orderId: string, newOrderQuantity: number) {
    const order = await this.getOrder(orderId);

    if (newOrderQuantity === 0) {
      await order.update({ status: OrderStatuses.DELIVERED });
    } else if (newOrderQuantity > 0) {
      await order.update({
        orderQuantity: newOrderQuantity,
        status: OrderStatuses.ACTIVE,
      });
    }

    return order;
  }

  async updateStockPackSizeQuantity(
    medicineId: string,
    currentStockPackSizeQuantity: number,
    suppliedQuantity: number,
  ) {
    const newStockPackSizeQuantity =
      currentStockPackSizeQuantity + suppliedQuantity;

    const stock = await this.getStock(medicineId);

    await stock.update({
      packSizeQuantity: newStockPackSizeQuantity,
    });

    return stock;
  }

  async updateStockIssueQuantity(
    medicineId: string,
    currentStockIssueQuantity: number,
    stockIssueUnitPerPackSize: number,
    suppliedQuantity: number,
  ) {
    const newStockIssueQuantity =
      currentStockIssueQuantity + suppliedQuantity * stockIssueUnitPerPackSize;

    const stock = await this.getStock(medicineId);

    await stock.update({
      issueQuantity: newStockIssueQuantity,
    });

    return stock;
  }

  async create(orderId: string, createPurchaseDto: CreatePurchaseDto) {
    const order = await this.getOrder(orderId);

    const stock = await this.getStock(order.MedicineId);

    const pendingOrderQuantity = order.orderQuantity;

    const suppliedQuantity = createPurchaseDto.packSizeQuantity;

    const newOrderQuantity = this.getNewOrderQuantity(
      pendingOrderQuantity,
      suppliedQuantity,
    );

    // update order quantity
    await this.updateOrderQuantity(orderId, newOrderQuantity);

    // update stock pack size quantity
    await this.updateStockPackSizeQuantity(
      order.MedicineId,
      stock.packSizeQuantity,
      suppliedQuantity,
    );
    // update stock issue quantity

    await this.updateStockIssueQuantity(
      order.MedicineId,
      stock.issueQuantity,
      stock.issueUnitPerPackSize,
      suppliedQuantity,
    );

    const purchase = await this.purchaseRepository.create({
      ...createPurchaseDto,
      totalPackSizePrice:
        createPurchaseDto.pricePerPackSize * createPurchaseDto.packSizeQuantity,
      OrderId: orderId,
    });

    return await this.returnPurchaseWithoutId(purchase);
  }

  async getSupplierName(supplierId: string) {
    const supplier = await this.getSupplier(supplierId);

    return supplier.name;
  }

  async getMedicineName(medicineId: string) {
    const medicine = await this.getMedicine(medicineId);

    return medicine.name;
  }

  async returnPurchaseWithoutId(purchase: Purchase) {
    const order = await this.getOrder(purchase.OrderId);

    return {
      id: purchase.id,
      packSizeQuantity: purchase.packSizeQuantity,
      pricePerPackSize: purchase.pricePerPackSize,
      totalPackSizePrice: purchase.totalPackSizePrice,
      OrderId: purchase.OrderId,
      purchaseDate: new Date(purchase['purchaseDate']).toLocaleDateString(),
      medicine: await this.getMedicineName(order.MedicineId),
      supplier: await this.getSupplierName(order.SupplierId),
      orderDate: new Date(order['orderDate']).toLocaleDateString(),
    };
  }

  async findAll(withId: boolean, today: boolean) {
    let purchases: Purchase[];
    if (today) {
      const TODAY_START = new Date().setHours(0, 0, 0, 0);
      const NOW = new Date();

      purchases = await this.purchaseRepository.findAll({
        where: {
          purchaseDate: {
            [Op.gt]: TODAY_START,
            [Op.lt]: NOW,
          },
        },
      });
    } else {
      purchases = await this.purchaseRepository.findAll();
    }

    if (!withId)
      return await Promise.all(
        purchases.map(
          async (value) => await this.returnPurchaseWithoutId(value),
        ),
      );

    return purchases;
  }

  async findOneById(purchaseId: string) {
    return await this.getPurchase(purchaseId);
  }

  async findOne(purchaseId: string) {
    const purchase = await this.getPurchase(purchaseId);

    return await this.returnPurchaseWithoutId(purchase);
  }

  async update(
    orderId: string,
    purchaseId: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<{
    packSizeQuantity: number;
    purchaseDate: any;
    totalPackSizePrice: number;
    supplier: string;
    medicine: string;
    id: string;
    OrderId: string;
    orderDate: any;
    pricePerPackSize: number;
  }> {
    // this statement will throw if the purchase does not exist
    const purchase = await this.findOneById(purchaseId);

    const order = await this.getOrder(orderId);

    const stock = await this.getStock(order.MedicineId);

    if (updatePurchaseDto.packSizeQuantity) {
      const previouslySuppliedQuantity = purchase.packSizeQuantity;

      const pendingOrderQuantity = order.orderQuantity;

      const initialOrderQuantity =
        previouslySuppliedQuantity + pendingOrderQuantity;

      // rollback the order's quantity to it's initial state

      await order.update({
        orderQuantity: initialOrderQuantity,
      });

      // also rollback the stock's pack size quantity and issue quantity
      const previousStockPackSizeQuantity = stock.packSizeQuantity;

      const initialStockPackSizeQuantity =
        previousStockPackSizeQuantity - previouslySuppliedQuantity;

      const previousStockIssueQuantity = stock.issueQuantity;

      const stockIssueUnitPerPackSize = stock.issueUnitPerPackSize;

      const initialStockIssueQuantity =
        previousStockIssueQuantity -
        previouslySuppliedQuantity * stockIssueUnitPerPackSize;

      // update the stock
      await stock.update({
        packSizeQuantity: initialStockPackSizeQuantity,
        issueQuantity: initialStockIssueQuantity,
      });

      const suppliedQuantity = updatePurchaseDto.packSizeQuantity;

      const currentOrderQuantity = order.orderQuantity;

      const newOrderQuantity = this.getNewOrderQuantity(
        currentOrderQuantity,
        suppliedQuantity,
      );

      // update order quantity
      await this.updateOrderQuantity(orderId, newOrderQuantity);

      // update stock pack size quantity

      await this.updateStockPackSizeQuantity(
        order.MedicineId,
        stock.packSizeQuantity,
        suppliedQuantity,
      );

      // update stock issue quantity

      await this.updateStockIssueQuantity(
        order.MedicineId,
        stock.issueQuantity,
        stock.issueUnitPerPackSize,
        suppliedQuantity,
      );
    }

    //calculate the new total pack size price

    let updatedPurchase: Purchase;

    if (updatePurchaseDto.packSizeQuantity)
      updatedPurchase = await purchase.update(
        {
          ...updatePurchaseDto,
          totalPackSizePrice:
            purchase.pricePerPackSize * updatePurchaseDto.packSizeQuantity,
        },
        { where: { id: purchaseId } },
      );
    else if (updatePurchaseDto.pricePerPackSize)
      updatedPurchase = await purchase.update(
        {
          ...updatePurchaseDto,
          totalPackSizePrice:
            purchase.packSizeQuantity * updatePurchaseDto.pricePerPackSize,
        },
        { where: { id: purchaseId } },
      );
    else
      updatedPurchase = await purchase.update(
        { ...updatePurchaseDto },
        { where: { id: purchaseId } },
      );

    return await this.returnPurchaseWithoutId(updatedPurchase);
  }

  async remove(purchaseId: string) {
    const purchase = await this.findOneById(purchaseId);
    return await purchase.destroy();
  }
}
