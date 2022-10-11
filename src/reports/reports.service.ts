import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import PDFDocument from 'pdfkit-table';
import { Response } from 'express';
import { startCase } from 'lodash';
import { OrdersService } from '../orders/orders.service';
import { User } from '../users/entities';
import { Order } from '../orders/entities';
import { SalesService } from '../sales/sales.service';
import { Sale } from '../sales/entities';
import { MedicinesService } from '../medicines/medicines.service';
import { Medicine } from '../medicines/entities';
import { PurchasesService } from '../purchases/purchases.service';
import { CustomersService } from '../customers/customers.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { Customer } from '../customers/entities';
import { Supplier } from '../suppliers/entities';
import { OrderStatuses } from '../orders/enum';
import { SalesStatus } from '../sales/enums';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Header {
  label?: string;
  property?: string;
  width?: number;
  align?: string; //default 'left'
  valign?: string;
  headerColor?: string; //default '#BEBEBE'
  headerOpacity?: number; //default '0.5'
  headerAlign?: string; //default 'left'
  columnColor?: string;
  columnOpacity?: number;
  renderer?: (
    value: any,
    indexColumn?: number,
    indexRow?: number,
    row?: number,
    rectRow?: Rect,
    rectCell?: Rect,
  ) => string;
}

interface DataOptions {
  fontSize: number;
  fontFamily: string;
  separation: boolean;
}

interface Data {
  [key: string]: string | { label: string; options?: DataOptions };
}

interface Table {
  title?: string;
  subtitle?: string;
  headers?: (string | Header)[];
  datas?: Data[];
  rows?: string[][];
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly salesService: SalesService,
    private readonly medicinesService: MedicinesService,
    private readonly purchasesService: PurchasesService,
    private readonly customersService: CustomersService,
    private readonly suppliersService: SuppliersService,
  ) {}

  currencyFormatter(arg: number) {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KSH',
    });

    return formatter.format(arg);
  }

  async getModelTableAttributes(
    model: User | Order | Medicine | Customer | Supplier,
  ) {
    const options = model['_options'];

    const attributes: string[] = options.attributes;

    return attributes.filter((value) => value !== 'id');
  }

  async generateTableHeaders(attributes: string[]) {
    const headers: Header[] = attributes.map((value) => {
      return {
        label: startCase(value),
        property: value,
        renderer: null,
      };
    });

    return headers;
  }

  async generateModelTableRows(
    model: User[] | Order[] | Medicine[] | Sale[] | Customer[] | Supplier[],
    attributes: string[],
  ) {
    const modelDataValues = model.map((value) => {
      return value['dataValues'];
    });

    return modelDataValues.map((value) => {
      const newModelObj = attributes.map((value1) => {
        return value[value1];
      });
      return Object.values(newModelObj);
    });
  }

  async generateTableRows(entities: any[], attributes: string[]) {
    return entities.map((value) => {
      const newEntityObj = attributes.map((value1) => {
        return value[value1];
      });
      return Object.values(newEntityObj);
    });
  }

  async buildTable(
    dataCallback: { (chunk: any): boolean; (...args: any[]): void },
    endCallback: {
      (): Response;
      (...args: any[]): void;
    },
    headers: Header[],
    rows: any,
    title: string,
  ) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    doc.fontSize(20).font('Helvetica-Bold').text(title, {
      align: 'center',
    });

    doc.moveDown();

    const table: Table = {
      headers,
      rows,
    };

    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font('Helvetica').fontSize(8);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        indexColumn === 0 && doc.addBackground(rectRow, 'white', 0.15);
        return undefined;
      },
    });

    doc
      .moveDown()
      .fontSize(6)
      .font('Helvetica')
      .text(`Created At ${new Date().toLocaleString()}`, {
        align: 'justify',
      });

    doc
      .moveDown()
      .moveDown()
      .fontSize(7)
      .font('Helvetica')
      .text(
        `©️ ${new Date().getFullYear()} ResTechs Online Pharmaceutical Management System`,
        {
          align: 'center',
        },
      );

    doc.end();
  }

  // users

  async allUsersReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=users report ${new Date().toISOString()}.pdf`,
    });

    const users = await this.usersService.findAll();

    const attributes = await this.getModelTableAttributes(users[0]);

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateModelTableRows(users, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Users Report',
    );
  }

  // orders

  async allOrdersReport(res: Response, category: OrderStatuses) {
    let orders: any[];
    let reportName: string;

    switch (category) {
      case OrderStatuses.ACTIVE:
        orders = await this.ordersService.findActiveOrders(false);
        reportName = 'active orders';
        break;
      case OrderStatuses.PENDING:
        orders = await this.ordersService.findPendingOrders(false);
        reportName = 'pending orders';
        break;
      case OrderStatuses.DELIVERED:
        orders = await this.ordersService.findDeliveredOrders(false);
        reportName = 'delivered orders';
        break;
      case OrderStatuses.CANCELLED:
        orders = await this.ordersService.findCancelledOrders(false);
        reportName = 'cancelled orders';
        break;
      default:
        orders = await this.ordersService.findAll(false, false);
        reportName = 'orders';
    }

    const attributes = Object.keys(orders[0]).filter((value) => value !== 'id');

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(orders, attributes);

    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=${reportName} report ${new Date().toISOString()}.pdf`,
    });

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      `${startCase(reportName)} Report`,
    );
  }

  // sales

  async allSalesReport(
    res: Response,
    grouped: string,
    ungrouped,
    selection: SalesStatus,
  ) {
    let filename: string;

    let sales: Sale[] | any[];
    let attributes: string[];

    switch (selection) {
      case SalesStatus.CANCELLED:
        sales = await this.salesService.findAllCancelledSales('false');
        filename = 'cancelled sales';
        if (sales.length > 0)
          attributes = Object.keys(sales[0]).filter(
            (value) => value !== 'id' && value !== 'amountReceived',
          );
        else {
          throw new PreconditionFailedException('No Cancelled sales found!');
        }
        break;
      case SalesStatus.ISSUED:
        sales = await this.salesService.findAllIssuedSales('false');
        filename = 'issued sales';

        attributes = Object.keys(sales[0]).filter(
          (value) => value !== 'id' && value !== 'amountReceived',
        );
        break;
      case SalesStatus.PENDING:
        sales = await this.salesService.findAllPendingSales('false');
        filename = 'pending sales';

        attributes = Object.keys(sales[0]).filter(
          (value) => value !== 'id' && value !== 'amountReceived',
        );
        break;
      default:
        if (ungrouped === 'true') {
          sales = await this.salesService.findAllUnGroupedSales('false');
          filename = 'all sales';

          attributes = Object.keys(sales[0]).filter(
            (value) => value !== 'id' && value !== 'amountReceived',
          );
        } else if (grouped === 'true') {
          sales = await this.salesService.findAllGroupedBySaleDate('false');
          filename = 'sales';
          attributes = Object.keys(sales[0]).filter((value) => value !== 'id');
        }
    }

    const newSalesEntities = sales.map((value) => {
      const salesMap: Map<string, any> = new Map<string, any>();

      attributes.forEach((value1) => {
        salesMap.set(value1, value[value1]);
      });

      const saleEntity = Object.fromEntries(salesMap.entries());

      saleEntity['issueUnitPrice'] = this.currencyFormatter(
        +saleEntity['issueUnitPrice'],
      );
      saleEntity['totalPrice'] = this.currencyFormatter(
        +saleEntity['totalPrice'],
      );
      saleEntity['totalPrices'] = this.currencyFormatter(
        +saleEntity['totalPrices'],
      );
      saleEntity['amountReceived'] = this.currencyFormatter(
        +saleEntity['amountReceived'],
      );

      return saleEntity;
    });

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(newSalesEntities, attributes);

    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment; filename=${filename} report ${new Date().toISOString()}.pdf`,
    });

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Sales Report',
    );
  }

  async generateSalesReceipt(res: Response, customerId: string) {
    const sales = await this.salesService.findAllSalesByCustomerId(
      customerId,
      'false',
    );

    const customerName: string = sales[0].customer as string;

    const totalAmountArr = sales.map((value) => value.totalPrice);

    const amountReceived = totalAmountArr.reduce(
      (previousValue, currentValue) => {
        return previousValue + currentValue;
      },
    );

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Sales Receipt', {
        align: 'center',
      })
      .moveDown();

    const attributes = [
      'medicine',
      'issueUnitQuantity',
      'issueUnitPrice',
      'status',
      'saleDate',
      'totalPrice',
    ];

    const headers = await this.generateTableHeaders(attributes);

    const newSaleByCustomerEntities = sales.map((value) => {
      const saleByCustomerMap: Map<string, any> = new Map();

      attributes.forEach((value1) => {
        saleByCustomerMap.set(value1, value[value1]);
      });

      const saleByCustomerEntity = Object.fromEntries(
        saleByCustomerMap.entries(),
      );

      saleByCustomerEntity['issueUnitPrice'] = this.currencyFormatter(
        +saleByCustomerEntity['issueUnitPrice'],
      );
      saleByCustomerEntity['saleDate'] = new Date(
        saleByCustomerEntity['saleDate'],
      ).toLocaleDateString();
      saleByCustomerEntity['totalPrice'] = this.currencyFormatter(
        +saleByCustomerEntity['totalPrice'],
      );

      return saleByCustomerEntity;
    });

    const rows = await this.generateTableRows(
      newSaleByCustomerEntities,
      attributes,
    );

    const table: Table = {
      title: `Name: ${customerName}`,
      subtitle: `Amount Received: ${this.currencyFormatter(+amountReceived)}`,
      headers,
      rows,
    };

    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=${startCase(
        customerName,
      )} sales receipt ${new Date().toISOString()}.pdf`,
    });

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font('Helvetica').fontSize(8);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        indexColumn === 0 && doc.addBackground(rectRow, 'white', 0.15);
        return undefined;
      },
    });

    doc.on('data', (chunk) => stream.write(chunk));
    doc.on('end', () => stream.end());

    doc
      .moveDown()
      .fontSize(10)
      .text(`Total Amount = ${this.currencyFormatter(+amountReceived)}`, {
        align: 'right',
        underline: true,
      });

    doc
      .moveDown()
      .fontSize(6)
      .font('Helvetica')
      .text(`Created At ${new Date().toLocaleString()}`, {
        align: 'justify',
      });

    doc
      .moveDown()
      .moveDown()
      .fontSize(8)
      .font('Helvetica')
      .text(
        `©️ ${new Date().getFullYear()} ResTechs Online Pharmaceutical Management System`,
        {
          align: 'center',
        },
      );

    doc.end();
  }

  // medicines

  async allMedicineStockReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=medicine stock report ${new Date().toISOString()}.pdf`,
    });

    const medicines = await this.medicinesService.findAll();

    const attributes = [
      'name',
      'packSize',
      'issueUnitSellingPrice',
      'issueUnitQuantity',
      'issueUnitPerPackSize',
      'packSizeQuantity',
      'expiryDate',
    ];

    const newMedicinesEntities = medicines.map((value) => {
      const medicineMap: Map<string, any> = new Map();

      attributes.forEach((value1) => {
        medicineMap.set(value1, value[value1]);
      });

      const medicineEntity = Object.fromEntries(medicineMap.entries());

      medicineEntity['expiryDate'] = new Date(
        medicineEntity['expiryDate'],
      ).toLocaleDateString();
      medicineEntity['issueUnitSellingPrice'] = this.currencyFormatter(
        +medicineEntity['issueUnitSellingPrice'],
      );

      return medicineEntity;
    });

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(newMedicinesEntities, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Medicine Stock Report',
    );
  }

  async allMedicinesReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=medicine report ${new Date().toISOString()}.pdf`,
    });

    const medicines = await this.medicinesService.findAllWithoutStockInfo();

    // const attributes = Object.keys(medicines[0]);
    const attributes = await this.getModelTableAttributes(medicines[0]);

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateModelTableRows(medicines, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Medicines Report',
    );
  }

  async medicinesOutOfStockReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=out of stock report ${new Date().toISOString()}.pdf`,
    });

    const attributes = [
      'name',
      'packSize',
      'packSizeQuantity',
      'packSizePurchasePrice',
      'issueUnitQuantity',
      'issueUnitPerPackSize',
      'issueUnitSellingPrice',
      'expiryDate',
    ];

    const medicines = await this.medicinesService.findAllMedicineOutOfStock();

    const newMedicinesOutOfStockEntities = medicines.map((value) => {
      const medicineOutOfStockMap: Map<string, any> = new Map();

      attributes.forEach((value1) => {
        medicineOutOfStockMap.set(value1, value[value1]);
      });

      const medicineOutOfStockEntity = Object.fromEntries(
        medicineOutOfStockMap.entries(),
      );

      medicineOutOfStockEntity['expiryDate'] = new Date(
        medicineOutOfStockEntity['expiryDate'],
      ).toLocaleDateString();
      medicineOutOfStockEntity['packSizePurchasePrice'] =
        this.currencyFormatter(
          +medicineOutOfStockEntity['packSizePurchasePrice'],
        );
      medicineOutOfStockEntity['issueUnitSellingPrice'] =
        this.currencyFormatter(
          +medicineOutOfStockEntity['issueUnitSellingPrice'],
        );

      return medicineOutOfStockEntity;
    });

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(
      newMedicinesOutOfStockEntities,
      attributes,
    );

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Out Stock Report',
    );
  }

  async expiredMedicinesReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=expired medicine report ${new Date().toISOString()}.pdf`,
    });

    const attributes = [
      'name',
      'packSizeQuantity',
      'issueUnitQuantity',
      'issueUnitPerPackSize',
      'issueUnitSellingPrice',
      'expiryDate',
    ];

    const medicines = await this.medicinesService.findAllExpiredMedicines();

    const newExpiredMedicineEntities = medicines.map((value) => {
      const expiredMedicineMap: Map<string, any> = new Map();

      attributes.forEach((value1) => {
        expiredMedicineMap.set(value1, value[value1]);
      });

      const expiredMedicineEntity = Object.fromEntries(
        expiredMedicineMap.entries(),
      );

      expiredMedicineEntity['issueUnitSellingPrice'] = this.currencyFormatter(
        +expiredMedicineEntity['issueUnitSellingPrice'],
      );
      expiredMedicineEntity['expiryDate'] = new Date(
        expiredMedicineEntity['expiryDate'],
      ).toLocaleDateString();

      return expiredMedicineEntity;
    });

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(
      newExpiredMedicineEntities,
      attributes,
    );

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Expired Medicine Report',
    );
  }

  // purchases

  async allPurchasesReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=purchases report ${new Date().toISOString()}.pdf`,
    });

    const purchases = await this.purchasesService.findAll('false');

    const attributes = [
      'medicine',
      'supplier',
      'purchasedPackSizeQuantity',
      'pricePerPackSize',
      'totalPurchasePrice',
      'purchaseDate',
      'orderDate',
      'expiryDate',
    ];

    const newPurchasesEntities = purchases.map((value) => {
      const purchaseMap: Map<string, any> = new Map();

      attributes.forEach((value1) => {
        purchaseMap.set(value1, value[value1]);
      });

      const purchaseEntity = Object.fromEntries(purchaseMap.entries());

      purchaseEntity['purchaseDate'] = new Date(
        purchaseEntity['purchaseDate'],
      ).toLocaleDateString();
      purchaseEntity['orderDate'] = new Date(
        purchaseEntity['orderDate'],
      ).toLocaleDateString();
      purchaseEntity['expiryDate'] = new Date(
        purchaseEntity['expiryDate'],
      ).toLocaleDateString();
      purchaseEntity['totalPurchasePrice'] = this.currencyFormatter(
        +purchaseEntity['totalPurchasePrice'],
      );
      purchaseEntity['pricePerPackSize'] = this.currencyFormatter(
        +purchaseEntity['pricePerPackSize'],
      );

      return purchaseEntity;
    });

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateTableRows(newPurchasesEntities, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Purchases Report',
    );
  }

  // customers

  async allCustomersReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=customers report ${new Date().toISOString()}.pdf`,
    });

    const customers = await this.customersService.findAll();

    const attributes = await this.getModelTableAttributes(customers[0]);

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateModelTableRows(customers, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Customers Report',
    );
  }

  // suppliers

  async allSuppliersReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'access-control-expose-headers': 'Content-Disposition',
      'Content-Disposition': `attachment;filename=suppliers report ${new Date().toISOString()}.pdf`,
    });

    const suppliers = await this.suppliersService.findAll();

    const attributes = await this.getModelTableAttributes(suppliers[0]);

    const headers = await this.generateTableHeaders(attributes);

    const rows = await this.generateModelTableRows(suppliers, attributes);

    await this.buildTable(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      headers,
      rows,
      'Suppliers Report',
    );
  }
}
