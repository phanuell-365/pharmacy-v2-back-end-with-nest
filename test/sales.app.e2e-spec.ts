import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { DoseForms } from '../src/medicines/enums';
import { CreateMedicineDto } from '../src/medicines/dto';
import { CreateStockDto } from '../src/stock/dto';
import { CreateSupplierDto } from '../src/suppliers/dto';
import { CreateOrderDto } from '../src/orders/dto';
import { OrderStatuses } from '../src/orders/enum';
import { CreatePurchaseDto } from '../src/purchases/dto';
import { CreateSaleDto, UpdateSaleDto } from '../src/sales/dto';
import { SalesStatus } from '../src/sales/enums';
import { CreateCustomerDto } from '../src/customers/dto';

describe('Pharmacy Version 2 Sales App e2e', function () {
  let salesApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    salesApp = moduleRef.createNestApplication();
    salesApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await salesApp.init();
    await salesApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await salesApp.close();
  });

  describe('Auth', function () {
    const authDto: AuthDto = {
      username: 'Administrator',
      password: 'password_admin',
    };

    describe('Login', function () {
      it('should return an object having an access_token', function () {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...authDto })
          .expectStatus(201)
          .stores('accessToken', 'access_token');
      });
    });
  });

  describe('Medicine', function () {
    const medicineDto: CreateMedicineDto = {
      name: 'Penicillin',
      doseForm: DoseForms.CAPSULES,
      strength: '500mg',
      levelOfUse: 4,
      therapeuticClass: 'Pain Killers',
    };

    describe('Add Medicine', function () {
      it('should add a medicine', function () {
        return pactum
          .spec()
          .post('/medicines')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody({ ...medicineDto })
          .expectStatus(201)
          .expectBodyContains(medicineDto.levelOfUse)
          .stores('medicineId', 'id');
      });
    });

    describe('View Medicines', function () {
      it('should return an array of medicines', function () {
        return pactum
          .spec()
          .get('/medicines')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Add another Medicine', function () {
      const medicineDto: CreateMedicineDto = {
        name: 'Action',
        doseForm: DoseForms.CAPSULES,
        strength: '200mg',
        levelOfUse: 3,
        therapeuticClass: 'Pain Killers',
      };
      // medicineDto.name = 'Action';
      // medicineDto.levelOfUse = 3;
      // medicineDto.strength = '200mg';

      it('should add a medicine', function () {
        return pactum
          .spec()
          .post('/medicines')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody({ ...medicineDto })
          .expectStatus(201)
          .expectBodyContains(medicineDto.levelOfUse)
          .stores('medicine2Id', 'id');
      });
    });
  });

  describe('Stock', function () {
    const createStockDto: CreateStockDto = {
      issueUnitPrice: 300,
      issueUnitPerPackSize: 400,
      packSize: 'Bottle',
      packSizePrice: 200,
      expirationDate: new Date('2025/04/02'),
      MedicineId: '$S{medicineId}',
    };

    describe('Add stock', function () {
      it('should add stock', function () {
        return pactum
          .spec()
          .post('/stocks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...createStockDto })
          .expectBodyContains(createStockDto.MedicineId)
          .expectStatus(201)
          .stores('stockId', 'id');
      });
    });

    describe('View Stocks', function () {
      it('should return an array of stocks', function () {
        return pactum
          .spec()
          .get('/stocks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Add another stock', function () {
      const createStockDto: CreateStockDto = {
        issueUnitPrice: 5,
        issueUnitPerPackSize: 100,
        packSize: 'Box',
        packSizePrice: 500,
        expirationDate: new Date('2024/01/31'),
        MedicineId: '$S{medicine2Id}',
      };

      it('should add stock', function () {
        return pactum
          .spec()
          .post('/stocks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...createStockDto })
          .expectBodyContains(createStockDto.MedicineId)
          .expectStatus(201)
          .stores('stockId', 'id');
      });
    });
  });

  describe('Supplier', function () {
    describe('Add supplier', function () {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Alpha Healthcare',
        email: 'info@alfahealthcare.org',
        phone: '0720203959',
      };

      it('should add supplier', function () {
        return pactum
          .spec()
          .post('/suppliers')
          .withBody({ ...createSupplierDto })
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(201)
          .stores('supplierId', 'id');
      });
    });

    describe('View Suppliers', function () {
      it('should return an array of suppliers', function () {
        return pactum
          .spec()
          .get('/suppliers')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });
  });

  describe('Orders', function () {
    describe('Add order', function () {
      const createOrderDto: CreateOrderDto = {
        orderQuantity: 100,
        status: OrderStatuses.PENDING,
        MedicineId: '$S{medicineId}',
        SupplierId: '$S{supplierId}',
      };

      it('should place an order', function () {
        return pactum
          .spec()
          .post('/orders')
          .withBody({ ...createOrderDto })
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(201)
          .stores('orderId', 'id');
      });
    });

    describe('View orders', function () {
      it('should return an array of orders', function () {
        return pactum
          .spec()
          .get('/orders')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Place another order', function () {
      const createOrderDto: CreateOrderDto = {
        orderQuantity: 100,
        status: OrderStatuses.PENDING,
        MedicineId: '$S{medicine2Id}',
        SupplierId: '$S{supplierId}',
      };

      it('should place an order', function () {
        return pactum
          .spec()
          .post('/orders')
          .withBody({ ...createOrderDto })
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(201)
          .stores('order2Id', 'id');
      });
    });
  });

  describe('Purchases', function () {
    describe('Add purchase', function () {
      const purchasesDto: CreatePurchaseDto = {
        packSizeQuantity: 50,
        pricePerPackSize: 1200,
        OrderId: '$S{orderId}',
      };
      it('should add purchase', function () {
        return pactum
          .spec()
          .post('/purchases')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...purchasesDto })
          .expectStatus(201)
          .stores('purchaseId', 'id');
      });
    });

    describe('View Purchases', function () {
      it('should return an array of purchases', function () {
        return pactum
          .spec()
          .get('/purchases')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Add another purchase', function () {
      const purchasesDto: CreatePurchaseDto = {
        packSizeQuantity: 50,
        pricePerPackSize: 1200,
        OrderId: '$S{order2Id}',
      };

      it('should add another purchase', function () {
        return pactum
          .spec()
          .post('/purchases')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...purchasesDto })
          .expectStatus(201)
          .stores('purchaseId', 'id');
      });
    });
  });

  describe('Customers', function () {
    describe('Add customer', function () {
      const customerDto: CreateCustomerDto = {
        name: 'John Kiriamiti',
        email: 'johnkiriamiti@localhost.com',
        phone: '0739492874',
      };

      it('should add the customer', function () {
        return pactum
          .spec()
          .post('/customers')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...customerDto })
          .expectStatus(201)
          .stores('customerId', 'id');
      });
    });

    describe('View all customers', function () {
      it('should return an array of customers', function () {
        return pactum
          .spec()
          .get('/customers')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });
  });

  describe('Sales', function () {
    describe('Add sales', function () {
      const createSalesDto: CreateSaleDto[] = [
        {
          issueUnitQuantity: 24,
          status: SalesStatus.ISSUED,
          MedicineId: '$S{medicineId}',
          CustomerId: '$S{customerId}',
        },
        {
          issueUnitQuantity: 24,
          status: SalesStatus.ISSUED,
          MedicineId: '$S{medicineId}',
          CustomerId: '$S{customerId}',
        },
      ];

      it('should create the sales', function () {
        return pactum
          .spec()
          .post('/sales')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...createSalesDto })
          .expectStatus(201)
          .stores('saleId', 'id');
      });
    });

    describe('View all Sales', function () {
      it('should return an array of sales', function () {
        return pactum
          .spec()
          .get('/sales')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .inspect()
          .expectStatus(200);
      });

      it('should create the sales', function () {
        const createSalesDto: CreateSaleDto[] = [
          {
            issueUnitQuantity: 12,
            status: SalesStatus.ISSUED,
            MedicineId: '$S{medicineId}',
            CustomerId: '$S{customerId}',
          },
          {
            issueUnitQuantity: 32,
            status: SalesStatus.ISSUED,
            MedicineId: '$S{medicineId}',
            CustomerId: '$S{customerId}',
          },
          {
            issueUnitQuantity: 45,
            status: SalesStatus.ISSUED,
            MedicineId: '$S{medicine2Id}',
            CustomerId: '$S{customerId}',
          },
        ];
        return pactum
          .spec()
          .post('/sales')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...createSalesDto })
          .expectStatus(201)
          .stores('createdSaleDate', 'saleDate');
      });

      it('should return an array of sales', function () {
        return pactum
          .spec()
          .get('/sales')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .inspect()
          .expectStatus(200);
      });

      it('should return an array of sales by a customerId', function () {
        return pactum
          .spec()
          .get('/sales')
          .withQueryParams('date', '$S{createdSaleDate}')
          .withQueryParams('withId', 'true')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('View Sales', function () {
      it('should return an array', function () {
        return pactum
          .spec()
          .get('/sales')
          .withQueryParams('date', '$S{createdSaleDate}')
          .withQueryParams('withId', 'true')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .inspect()
          .expectStatus(200);
      });
    });

    describe('Update Sale', function () {
      const updateSaleDto: UpdateSaleDto = {
        MedicineId: '$S{medicine2Id}',
        CustomerId: '$S{customerId}',
        issueUnitQuantity: 50,
      };

      it('should return the updated sale', function () {
        return pactum
          .spec()
          .patch('/sales/{id}')
          .withPathParams('id', '$S{saleId}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ ...updateSaleDto })
          .expectStatus(200);
      });

      it('should return an array', function () {
        return pactum
          .spec()
          .get('/sales')
          .withQueryParams('date', '$S{createdSaleDate}')
          .withQueryParams('withId', 'true')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe("View Today's sales", function () {
      it('should return an array of sales', function () {
        return pactum
          .spec()
          .get('/sales')
          .withQueryParams('today', 'true')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .inspect()
          .expectStatus(200);
      });
    });
  });
});
