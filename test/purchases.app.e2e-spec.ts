import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { DoseForms } from '../src/medicines/enums';
import { CreateStockDto } from '../src/stock/dto';
import { CreateMedicineDto } from '../src/medicines/dto';
import { CreateSupplierDto } from '../src/suppliers/dto';
import { CreateOrderDto } from '../src/orders/dto';
import { OrderStatuses } from '../src/orders/enum';
import { CreatePurchaseDto, UpdatePurchaseDto } from '../src/purchases/dto';

describe('Pharmacy Version 2 Purchases App e2e', function () {
  let purchasesApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    purchasesApp = moduleRef.createNestApplication();
    purchasesApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await purchasesApp.init();
    await purchasesApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await purchasesApp.close();
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
      name: 'Mara Moja',
      doseForm: DoseForms.TABLETS,
      strength: '500mg',
      levelOfUse: 3,
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
          .expectBodyContains(medicineDto.therapeuticClass)
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
  });

  describe('Stock', function () {
    describe('Add stock', function () {
      const createStockDto: CreateStockDto = {
        issueUnitPrice: 500,
        issueUnitPerPackSize: 100,
        packSize: 'Box',
        packSizePrice: 15,
        expirationDate: new Date('2023/04/02'),
        MedicineId: '$S{medicineId}',
      };

      it('should add stock', function () {
        return pactum
          .spec()
          .post('/stock')
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
          .get('/stock')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });
  });

  describe('Supplier', function () {
    describe('Add supplier', function () {
      const createSupplierDto: CreateSupplierDto = {
        name: 'KEMSA',
        email: 'info@kemsa.go.ke',
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
        orderQuantity: 120,
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
  });

  describe('Purchases', function () {
    describe('Add purchase', function () {
      const purchasesDto: CreatePurchaseDto = {
        packSizeQuantity: 60,
        pricePerPackSize: 12,
        OrderId: '$S{orderId}',
      };
      it('should deliver an order', function () {
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
          .expectStatus(200)
          .inspect();
      });

      it('should return an array of purchases made today', function () {
        return pactum
          .spec()
          .get('/purchases')
          .withQueryParams('today', 'true')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('View all orders', function () {
      it('should return an array of orders', function () {
        return pactum
          .spec()
          .get('/orders')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('View active orders', function () {
      it('should return an array of active orders', function () {
        return pactum
          .spec()
          .get('/orders?status=active')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('View all stocks', function () {
      it('should return an array of stocks', function () {
        return pactum
          .spec()
          .get('/stock')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Update Purchase', function () {
      const updatePurchaseDto: UpdatePurchaseDto = {
        OrderId: '$S{orderId}',
        packSizeQuantity: 20,
      };

      it('should update the purchase', function () {
        return pactum
          .spec()
          .patch('/purchases/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{purchaseId}')
          .withBody({ ...updatePurchaseDto })
          .expectBodyContains(updatePurchaseDto.packSizeQuantity)
          .expectStatus(200);
      });

      describe('View all stocks', function () {
        it('should return an array of stocks', function () {
          return pactum
            .spec()
            .get('/stock')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200);
        });
      });
    });
  });
});
