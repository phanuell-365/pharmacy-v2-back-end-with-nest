import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from '../../../src/auth/dto';
import { CreateCustomerDto } from '../../../src/customers/dto';

describe('Analytics for Medicines e2e Tests', function () {
  let analyticsApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    analyticsApp = moduleRef.createNestApplication();
    analyticsApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await analyticsApp.init();
    await analyticsApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await analyticsApp.close();
  });

  describe('Auth', function () {
    const authDto: AuthDto = {
      username: 'Admin',
      password: 'admin',
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

  describe("Today's Customers", function () {
    describe('Get all customers aboard today.', function () {
      it('should return the number of customers aboard today.', function () {
        return pactum
          .spec()
          .get('/customers/analytics/today')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('The customers module', function () {
      describe("Add a customer to test the count of today's customers", function () {
        const customerDto: CreateCustomerDto = {
          name: 'John Doe',
          email: 'johndoe@localhost.com',
          phone: '0739492874',
        };

        it('should add the customer', function () {
          return pactum
            .spec()
            .post('/customers')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withBody({ ...customerDto })
            .expectStatus(201)
            .stores('customerId', 'id')
            .inspect();
        });
      });

      describe('View all customers', function () {
        it('should return an array of customers', function () {
          return pactum
            .spec()
            .get('/customers')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });
    });

    describe('Get all customers aboard after adding another', function () {
      it('should return the number of customers aboard today.', function () {
        return pactum
          .spec()
          .get('/customers/analytics/today')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .expectJsonLike({ total: 1 })
          .inspect();
      });
    });
  });
});
