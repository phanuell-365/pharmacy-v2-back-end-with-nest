import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { CreateMedicineDto, UpdateMedicineDto } from '../src/medicines/dto';
import { DoseForms } from '../src/medicines/enums';
import { CreateStockDto, UpdateStockDto } from '../src/stock/dto';

describe('Pharmacy Version 2 Stock App e2e', function () {
  let stockApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    stockApp = moduleRef.createNestApplication();
    stockApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await stockApp.init();
    await stockApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await stockApp.close();
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

  describe('Medicines', function () {
    const medicineDto: CreateMedicineDto = {
      name: 'Paracetamol',
      doseForm: DoseForms.TABLET,
      strength: '500mg',
      levelOfUse: 3,
      therapeuticClass: 'Pain Killers',
    };

    describe('Add Medicine', function () {
      it('should add a medicine into the database', function () {
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

    describe('View Medicine by Id', function () {
      it('should return a medicine with a specified id', function () {
        return pactum
          .spec()
          .get('/medicines/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{medicineId}')
          .expectStatus(200);
      });
    });

    describe('Manage Medicine', function () {
      const updateMedicineDto: UpdateMedicineDto = {
        name: 'Amoxicillin',
        doseForm: DoseForms.CAPSULE,
        strength: '250mg',
      };

      it("should update the medicine's name", function () {
        return pactum
          .spec()
          .patch('/medicines/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{medicineId}')
          .withBody({ name: updateMedicineDto.name })
          .expectStatus(200)
          .expectBodyContains(updateMedicineDto.name);
      });
    });

    describe('Stock', function () {
      describe('Add stock', function () {
        const createStockDto: CreateStockDto = {
          issueUnitPrice: 300,
          issueUnitPerPackSize: 30,
          packSize: 'Bottle',
          packSizePrice: 700,
          expirationDate: new Date('2023/04/02'),
          MedicineId: '$S{medicineId}',
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

      describe('View stock', function () {
        it('should return a stock by specified id', function () {
          return pactum
            .spec()
            .get('/stocks/{id}')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withPathParams('id', '$S{stockId}')
            .expectStatus(200);
        });
      });

      describe('View Stocks', function () {
        it('should return an array of stocks', function () {
          return pactum
            .spec()
            .get('/stocks')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });

      describe('Manage Stock', function () {
        const updateStockDto: UpdateStockDto = {
          issueUnitPrice: 500,
          MedicineId: '$S{medicineId}',
        };

        it('should update a stock', function () {
          return pactum
            .spec()
            .patch('/stocks/{id}?withId=true')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .withBody({ ...updateStockDto })
            .withPathParams('id', '$S{stockId}')
            .expectBodyContains(updateStockDto.issueUnitPrice)
            .expectStatus(200)
            .inspect();
        });
      });
    });
  });
});
