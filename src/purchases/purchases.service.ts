import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  PreconditionFailedException,
} from '@nestjs/common';
import { Order } from '../orders/entities';
import { OrderStatuses } from '../orders/enum';
import { PURCHASES_REPOSITORY } from './constants';
import { ORDERS_REPOSITORY } from '../orders/constants';
// import { STOCK_REPOSITORY } from '../stock/constants';
import { Purchase } from './entities';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto';
// import { Stock } from '../stock/entities';
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
    // @Inject(STOCK_REPOSITORY)
    // private readonly stockRepository: typeof Stock,
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

    return order;
  }

  // check if medicine is already expired
  async checkIfMedicineIsExpired(medicine: Medicine) {
    const NOW = new Date();

    if (medicine.expiryDate <= NOW) {
      throw new PreconditionFailedException(
        'Attempt to purchase an expired medicine!',
      );
    }

    return medicine;
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
      throw new ForbiddenException('Medicine not found!');
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

  async updateMedicinePackSizeQuantity(
    medicineId: string,
    currentMedicinePackSizeQuantity: number,
    suppliedQuantity: number,
  ) {
    const newMedicinePackSizeQuantity =
      currentMedicinePackSizeQuantity + suppliedQuantity;

    const medicine = await this.getMedicine(medicineId);

    await medicine.update({
      packSizeQuantity: newMedicinePackSizeQuantity,
    });

    return medicine;
  }

  async updateMedicineIssueQuantity(
    medicineId: string,
    medicineIssueUnitPerPackSize: number,
    suppliedQuantity: number,
  ) {
    const newMedicineIssueQuantity =
      suppliedQuantity * medicineIssueUnitPerPackSize;

    const medicine = await this.getMedicine(medicineId);

    await medicine.update({
      issueUnitQuantity: newMedicineIssueQuantity,
    });

    return medicine;
  }

  // order functions

  async calculateNewOrderQuantity(order: Order, suppliedQuantity: number) {
    return order.orderQuantity - suppliedQuantity;
  }

  // medicine pack size utility functions

  async calculateNewMedicinePackSizeQuantity(
    medicine: Medicine,
    suppliedQuantity: number,
  ) {
    return medicine.packSizeQuantity + suppliedQuantity;
  }

  async setMedicinePackSizeQuantity(
    medicine: Medicine,
    medicinePackSizeQuantity: number,
  ) {
    await medicine.update({
      packSizeQuantity: medicinePackSizeQuantity,
    });

    return medicine;
  }

  async setMedicinePackSizePurchasePrice(
    medicine: Medicine,
    purchasePrice: number,
  ) {
    await medicine.update({
      packSizePurchasePrice: purchasePrice,
    });

    return medicine;
  }

  async calculateAndSetNewPackSizeSellingPrice(
    medicine: Medicine,
    purchasePrice: number,
  ) {
    // calculate new pack size sell price adding 40% interest rate to purchase price
    const newPackSizeSellingPrice = purchasePrice + (purchasePrice * 40) / 100;

    // if new pack size selling price is greater than current pack size selling price
    if (newPackSizeSellingPrice > medicine.packSizeSellingPrice) {
      // update pack size sell price
      await medicine.update({
        packSizeSellingPrice: newPackSizeSellingPrice,
      });
    } else {
      // else set pack size selling price to current pack size selling price
      await medicine.update({
        packSizeSellingPrice: medicine.packSizeSellingPrice,
      });
    }

    return medicine;
  }

  async calculateProfitMarginPercentagePerPackSize(
    medicine: Medicine,
    purchasePrice: number,
  ) {
    return (
      ((medicine.packSizeSellingPrice - purchasePrice) / purchasePrice) * 100
    );
  }

  async calculateTotalProfitMarginPerPackSize(
    medicine: Medicine,
    purchasePrice: number,
  ) {
    return medicine.packSizeSellingPrice - purchasePrice;
  }

  async setMedicinePackSizeProfitMarginPrice(
    medicine: Medicine,
    // profitMarginPercentagePerPackSize: number,
  ) {
    await medicine.update({
      profitPerPackSize: await this.calculateTotalProfitMarginPerPackSize(
        medicine,
        medicine.packSizePurchasePrice,
      ),
    });

    return medicine;
  }

  // medicine issue unit utility functions

  async setMedicineIssueUnitPerPackSize(
    medicine: Medicine,
    medicineIssueUnitPerPackSize: number,
  ) {
    await medicine.update({
      issueUnitPerPackSize: medicineIssueUnitPerPackSize,
    });

    return medicine;
  }

  async calculateNewMedicineIssueUnitQuantity(
    medicine: Medicine,
    medicineIssueQuantity: number,
    suppliedQuantity: number,
  ) {
    return (
      medicine.issueUnitQuantity + medicineIssueQuantity * suppliedQuantity
    );
  }

  async setNewMedicineIssueUnitQuantity(
    medicine: Medicine,
    newIssueUnitQuantity: number,
  ) {
    await medicine.update({
      issueUnitQuantity: newIssueUnitQuantity,
    });

    return medicine;
  }

  async calculateIssueUnitPurchasePrice(
    medicine: Medicine,
    purchasePrice: number,
  ) {
    return purchasePrice / medicine.issueUnitPerPackSize;
  }

  async setMedicineIssueUnitPurchasePrice(
    medicine: Medicine,
    issueUnitPurchasePrice: number,
  ) {
    await medicine.update({
      issueUnitPurchasePrice: issueUnitPurchasePrice,
    });

    return medicine;
  }

  // calculate the new issue unit selling price based on the new pack size selling price
  async calculateAndSetNewIssueUnitSellingPrice(medicine: Medicine) {
    const newIssueUnitSellingPrice =
      medicine.packSizeSellingPrice / medicine.issueUnitPerPackSize;

    // calculate new issue unit sell price adding 40% interest rate to purchase price
    // const newIssueUnitSellingPrice = purchasePrice + (purchasePrice * 40) / 100;

    // if new issue unit selling price is greater than current issue unit selling price
    if (newIssueUnitSellingPrice > medicine.issueUnitSellingPrice) {
      // update issue unit sell price
      await medicine.update({
        issueUnitSellingPrice: newIssueUnitSellingPrice,
      });
    } else {
      // else set issue unit selling price to current issue unit selling price
      await medicine.update({
        issueUnitSellingPrice: medicine.issueUnitSellingPrice,
      });
    }

    return medicine;
  }

  async calculateProfitMarginPercentagePerIssueUnit(
    medicine: Medicine,
    issueUnitPurchasePrice: number,
  ) {
    return (
      ((medicine.issueUnitSellingPrice - issueUnitPurchasePrice) /
        issueUnitPurchasePrice) *
      100
    );
  }

  async calculateTotalProfitMarginPerIssueUnit(
    medicine: Medicine,
    issueUnitPurchasePrice: number,
  ) {
    return medicine.issueUnitSellingPrice - issueUnitPurchasePrice;
  }

  async setMedicineIssueUnitProfitMarginPrice(
    medicine: Medicine,
    // profitMarginPercentagePerIssueUnit: number,
  ) {
    await medicine.update({
      profitPerIssueUnit: await this.calculateTotalProfitMarginPerIssueUnit(
        medicine,
        medicine.issueUnitPurchasePrice,
      ),
    });

    return medicine;
  }

  // update the medicine expiry date
  async updateMedicineExpiryDate(medicine: Medicine, expiryDate: Date) {
    await medicine.update({
      expiryDate: expiryDate,
    });

    return medicine;
  }

  // calculate the total purchase price
  async calculateTotalPurchasePrice(
    purchasePrice: number,
    suppliedQuantity: number,
  ) {
    return purchasePrice * suppliedQuantity;
  }

  // set the total purchase price
  async setTotalPurchasePrice(medicine: Medicine, totalPurchasePrice: number) {
    await medicine.update({
      totalPurchasePrice: totalPurchasePrice,
    });

    return medicine;
  }

  // calculate the total issue unit quantity
  async calculateTotalIssueUnitQuantity(
    medicine: Medicine,
    suppliedQuantity: number,
  ) {
    return medicine.issueUnitPerPackSize * suppliedQuantity;
  }

  // medicine utility functions

  async create(orderId: string, createPurchaseDto: CreatePurchaseDto) {
    // get order
    const order = await this.getOrder(orderId);

    // get medicine
    const medicine = await this.getMedicine(order.MedicineId);

    // check if the medicine is already expired
    await this.checkIfMedicineIsExpired(medicine);

    // calculate supplied quantity
    const suppliedQuantity = createPurchaseDto.purchasedPackSizeQuantity;

    // calculate new order quantity
    const newOrderQuantity = await this.calculateNewOrderQuantity(
      order,
      suppliedQuantity,
    );

    // update order quantity
    await this.updateOrderQuantity(orderId, newOrderQuantity);

    // calculate new medicine pack size quantity
    const newMedicinePackSizeQuantity =
      await this.calculateNewMedicinePackSizeQuantity(
        medicine,
        suppliedQuantity,
      );

    // set new medicine pack size quantity
    await this.setMedicinePackSizeQuantity(
      medicine,
      newMedicinePackSizeQuantity,
    );

    // set medicine issue unit per pack size
    await this.setMedicineIssueUnitPerPackSize(
      medicine,
      createPurchaseDto.issueUnitPerPackSize,
    );

    // calculate new medicine issue unit quantity
    const newMedicineIssueUnitQuantity =
      await this.calculateNewMedicineIssueUnitQuantity(
        medicine,
        createPurchaseDto.issueUnitPerPackSize,
        suppliedQuantity,
      );

    // set new medicine issue unit quantity
    await this.setNewMedicineIssueUnitQuantity(
      medicine,
      newMedicineIssueUnitQuantity,
    );

    // set pack size purchase price
    await this.setMedicinePackSizePurchasePrice(
      medicine,
      createPurchaseDto.pricePerPackSize,
    );

    // calculate issue unit purchase price
    const issueUnitPurchasePrice = await this.calculateIssueUnitPurchasePrice(
      medicine,
      createPurchaseDto.pricePerPackSize,
    );

    // set issue unit purchase price
    await this.setMedicineIssueUnitPurchasePrice(
      medicine,
      issueUnitPurchasePrice,
    );

    // calculate and set new pack size sell price
    await this.calculateAndSetNewPackSizeSellingPrice(
      medicine,
      createPurchaseDto.pricePerPackSize,
    );

    // calculate and set new issue unit sell price
    await this.calculateAndSetNewIssueUnitSellingPrice(medicine);

    // calculate profit margin percentage per pack size
    const profitMarginPercentagePerPackSize =
      await this.calculateProfitMarginPercentagePerPackSize(
        medicine,
        createPurchaseDto.pricePerPackSize,
      );

    // calculate profit margin percentage per issue unit
    const profitMarginPercentagePerIssueUnit =
      await this.calculateProfitMarginPercentagePerIssueUnit(
        medicine,
        issueUnitPurchasePrice,
      );

    // calculate total profit margin per pack size
    const totalProfitMarginPerPackSize =
      await this.calculateTotalProfitMarginPerPackSize(
        medicine,
        createPurchaseDto.pricePerPackSize,
      );

    // calculate total profit margin per issue unit
    const totalProfitMarginPerIssueUnit =
      await this.calculateTotalProfitMarginPerIssueUnit(
        medicine,
        issueUnitPurchasePrice,
      );

    // set medicine pack size profit margin
    await this.setMedicinePackSizeProfitMarginPrice(
      medicine,
      // profitMarginPercentagePerPackSize,
    );

    // set medicine issue unit profit margin
    await this.setMedicineIssueUnitProfitMarginPrice(
      medicine,
      // profitMarginPercentagePerIssueUnit,
    );

    // update medicine expiry date
    await this.updateMedicineExpiryDate(medicine, createPurchaseDto.expiryDate);

    // calculate total purchase price
    const totalPurchasePrice = await this.calculateTotalPurchasePrice(
      createPurchaseDto.pricePerPackSize,
      suppliedQuantity,
    );

    // set total purchase price
    await this.setTotalPurchasePrice(medicine, totalPurchasePrice);

    // create purchase
    const purchase = await this.purchaseRepository.create({
      ...createPurchaseDto,
      totalPurchasePrice: await this.calculateTotalPurchasePrice(
        createPurchaseDto.pricePerPackSize,
        suppliedQuantity,
      ),
      totalIssueUnitQuantity: await this.calculateTotalIssueUnitQuantity(
        medicine,
        suppliedQuantity,
      ),
      OrderId: orderId,
      profitMarginPercentagePerPackSize: profitMarginPercentagePerPackSize,
      profitMarginPercentagePerIssueUnit: profitMarginPercentagePerIssueUnit,
      profitPerPackSize: totalProfitMarginPerPackSize,
      profitPerIssueUnit: totalProfitMarginPerIssueUnit,
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

    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KSH',
    });

    return {
      id: purchase.id,
      purchasedPackSizeQuantity: purchase.purchasedPackSizeQuantity,
      pricePerPackSize: formatter.format(purchase.pricePerPackSize),
      totalPurchasePrice: formatter.format(purchase.totalPurchasePrice),
      issueUnitPerPackSize: purchase.issueUnitPerPackSize,
      profitMarginPercentagePerPackSize:
        purchase.profitMarginPercentagePerPackSize,
      profitMarginPercentagePerIssueUnit:
        purchase.profitMarginPercentagePerIssueUnit,
      profitPerPackSize: purchase.profitPerPackSize,
      profitPerIssueUnit: purchase.profitPerIssueUnit,
      totalIssueUnitQuantity: purchase.totalIssueUnitQuantity,
      expiryDate: purchase.expiryDate,
      OrderId: purchase.OrderId,
      purchaseDate: new Date(purchase['purchaseDate']).toLocaleDateString(),
      orderStatus: (await this.getOrder(purchase.OrderId)).status,
      medicine: await this.getMedicineName(order.MedicineId),
      supplier: await this.getSupplierName(order.SupplierId),
      orderDate: new Date(order['orderDate']).toLocaleDateString(),
    };
  }

  async findAll(withId: string, today: string) {
    let purchases: Purchase[];
    if (today === 'true') {
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

    if (withId === 'true') return purchases;
    else {
      return await Promise.all(
        purchases.map(
          async (value) => await this.returnPurchaseWithoutId(value),
        ),
      );
    }
  }

  async findOneById(purchaseId: string) {
    return await this.getPurchase(purchaseId);
  }

  async findOne(purchaseId: string) {
    const purchase = await this.getPurchase(purchaseId);

    return await this.returnPurchaseWithoutId(purchase);
  }

  async update(
    purchaseId: string,
    orderId: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ) {
    // check if the purchase exists
    const purchase = await this.getPurchase(purchaseId);

    // get order
    const order = await this.getOrder(orderId);

    // get medicine
    const medicine = await this.getMedicine(order.MedicineId);

    // check if the order is delivered
    if (order.status === OrderStatuses.DELIVERED) {
      throw new BadRequestException(
        'Cannot update purchase for an order that is delivered',
      );
    }

    // check if the order is cancelled
    if (order.status === OrderStatuses.CANCELLED) {
      throw new BadRequestException(
        'Cannot update purchase for an order that is cancelled',
      );
    }

    // check if the order is active
    // if (order.status === OrderStatuses.ACTIVE) {
    //   throw new BadRequestException(
    //     'Cannot update purchase for an order that is active',
    //   );
    // }

    // find the initial purchase quantity
    const initialPurchaseQuantity = purchase.purchasedPackSizeQuantity;

    // find the pending order quantity
    const pendingOrderQuantity = order.orderQuantity;

    // find the initial order quantity
    const initialOrderQuantity = initialPurchaseQuantity + pendingOrderQuantity;

    // rollback and update the order quantity
    await order.update({
      orderQuantity: initialOrderQuantity,
    });

    // rollback and update the medicine pack size quantity

    const previousMedicinePackSizeQuantity = medicine.packSizeQuantity;

    const initialMedicinePackSizeQuantity =
      previousMedicinePackSizeQuantity - initialPurchaseQuantity;

    const previousMedicineIssueUnitQuantity = medicine.issueUnitQuantity;

    const issueUnitPerPackSize = medicine.issueUnitPerPackSize;

    const initialMedicineIssueUnitQuantity =
      previousMedicineIssueUnitQuantity -
      initialPurchaseQuantity * issueUnitPerPackSize;

    await medicine.update({
      packSizeQuantity: initialMedicinePackSizeQuantity,
      issueUnitQuantity: initialMedicineIssueUnitQuantity,
    });

    const purchasedPackSizeQuantity =
      updatePurchaseDto.purchasedPackSizeQuantity;

    const currentOrderQuantity = order.orderQuantity;

    const newOrderQuantity = this.getNewOrderQuantity(
      currentOrderQuantity,
      purchasedPackSizeQuantity,
    );

    // update the order quantity
    await order.update({
      orderQuantity: newOrderQuantity,
    });

    // update the medicine issue unit per pack size
    await medicine.update({
      issueUnitPerPackSize: updatePurchaseDto.issueUnitPerPackSize,
    });

    // update the medicine pack size quantity
    await this.updateMedicinePackSizeQuantity(
      medicine.id,
      medicine.packSizeQuantity,
      purchasedPackSizeQuantity,
    );

    await this.updateMedicineIssueQuantity(
      medicine.id,
      updatePurchaseDto.issueUnitPerPackSize,
      updatePurchaseDto.purchasedPackSizeQuantity,
    );

    // check if the expiry date is valid
    const expiryDate = updatePurchaseDto.expiryDate;

    if (!this.validateExpiryDate(expiryDate)) {
      throw new BadRequestException('Invalid expiry date');
    }
    // update the purchase
    await purchase.update({
      ...updatePurchaseDto,
    });

    const issueUnitPurchasePrice = await this.calculateIssueUnitPurchasePrice(
      medicine,
      updatePurchaseDto.pricePerPackSize,
    );

    await this.calculateAndSetNewIssueUnitSellingPrice(medicine);

    await this.setMedicineIssueUnitPurchasePrice(
      medicine,
      issueUnitPurchasePrice,
    );

    // calculate the profit margin percentage per pack size
    const profitMarginPercentagePerPackSize =
      await this.calculateProfitMarginPercentagePerPackSize(
        medicine,
        updatePurchaseDto.pricePerPackSize,
      );

    // calculate the profit margin percentage per issue unit
    const profitMarginPercentagePerIssueUnit =
      await this.calculateProfitMarginPercentagePerIssueUnit(
        medicine,
        issueUnitPurchasePrice,
      );

    const totalPurchasePrice = await this.calculateTotalPurchasePrice(
      updatePurchaseDto.pricePerPackSize,
      updatePurchaseDto.purchasedPackSizeQuantity,
    );

    const totalProfitMarginPerPackSize =
      await this.calculateTotalProfitMarginPerPackSize(
        medicine,
        updatePurchaseDto.pricePerPackSize,
      );

    const totalProfitMarginPerIssueUnit =
      await this.calculateTotalProfitMarginPerIssueUnit(
        medicine,
        issueUnitPurchasePrice,
      );

    // update the purchase
    await purchase.update({
      purchasedPackSizeQuantity: purchasedPackSizeQuantity,
      pricePerPackSize: updatePurchaseDto.pricePerPackSize,
      totalPurchasePrice,
      issueUnitPerPackSize: updatePurchaseDto.issueUnitPerPackSize,
      profitMarginPercentagePerPackSize,
      profitMarginPercentagePerIssueUnit,
      profitPerPackSize: totalProfitMarginPerPackSize,
      profitPerIssueUnit: totalProfitMarginPerIssueUnit,
      totalIssueUnitQuantity: await this.calculateTotalIssueUnitQuantity(
        medicine,
        purchasedPackSizeQuantity,
      ),
      expiryDate: updatePurchaseDto.expiryDate,
    });

    return await this.returnPurchaseWithoutId(purchase);
  }

  validateExpiryDate(expiryDate: Date) {
    const today = new Date();

    const todayDate = today.getDate();

    const todayMonth = today.getMonth() + 1;

    const todayYear = today.getFullYear();

    const todayDateMonthYear = `${todayDate}-${todayMonth}-${todayYear}`;

    const todayDateMonthYearDate = new Date(todayDateMonthYear);

    const expiryDateDate = new Date(expiryDate);

    if (expiryDateDate < todayDateMonthYearDate) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    return true;
  }

  async remove(purchaseId: string) {
    const purchase = await this.findOneById(purchaseId);
    return await purchase.destroy();
  }
}
