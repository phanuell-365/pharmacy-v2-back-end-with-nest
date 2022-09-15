import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { DoseForms } from '../src/medicines/enums';
import { CreateMedicineDto } from '../src/medicines/dto';
import { CreateStockDto } from '../src/stock/dto';
import { CreateOrderDto, UpdateOrderDto } from '../src/orders/dto';
import { OrderStatuses } from '../src/orders/enum';
import { CreateSupplierDto } from '../src/suppliers/dto';

describe('Pharmacy Version 2 Orders App e2e', function () {
  let ordersApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    ordersApp = moduleRef.createNestApplication();
    ordersApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await ordersApp.init();
    await ordersApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await ordersApp.close();
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

    describe('Medicine', function () {
      const medicineDto: CreateMedicineDto = {
        name: 'Amoxicillin',
        doseForm: DoseForms.CAPSULE,
        strength: '250mg',
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

      describe('Stock', function () {
        describe('Add stock', function () {
          const createStockDto: CreateStockDto = {
            issueUnitPrice: 250,
            issueUnitPerPackSize: 40,
            packSize: 'Box',
            packSizePrice: 750,
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
    });

    describe('Supplier', function () {
      describe('Add supplier', function () {
        const createSupplierDto: CreateSupplierDto = {
          name: 'Beta Healthcare',
          email: 'info@betahealthcare.com',
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
          orderQuantity: 50,
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

      describe('View an order by id', function () {
        it('should return an order with the specified id', function () {
          return pactum
            .spec()
            .get('/orders/{id}')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withPathParams('id', '$S{orderId}')
            .expectStatus(200);
        });
      });

      describe('Update an order by id', function () {
        const updateOrderDto: UpdateOrderDto = {
          orderQuantity: 30,
          MedicineId: '$S{medicineId}',
          SupplierId: '$S{supplierId}',
        };

        it('should update an order', function () {
          return pactum
            .spec()
            .patch('/orders/{id}')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withPathParams('id', '$S{orderId}')
            .withBody({ ...updateOrderDto })
            .expectStatus(200)
            .expectBodyContains(updateOrderDto.orderQuantity);
        });
      });

      describe('Cancel an order', function () {
        it('should mark the order by the id specified cancelled', function () {
          return pactum
            .spec()
            .delete('/orders/{id}')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withPathParams('id', '$S{orderId}')
            .expectStatus(204);
        });
      });

      describe('View cancelled orders', function () {
        it('should return an array of cancelled orders', function () {
          return pactum
            .spec()
            .get('/orders?status=cancelled')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });

      describe('View pending orders', function () {
        it('should return an array of pending orders', function () {
          return pactum
            .spec()
            .get('/orders?status=pending')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });

      describe('View active orders', function () {
        it('should return an array of active orders', function () {
          return pactum
            .spec()
            .get('/orders?status=active')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });
    });
  });
});
