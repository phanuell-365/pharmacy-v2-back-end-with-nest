import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DoseForms } from '../../../src/medicines/enums';
import { AuthDto } from '../../../src/auth/dto';
import * as pactum from 'pactum';
import { CreateMedicineDto } from '../../../src/medicines/dto';

describe('Pharmacy Version 2 Medicines App e2e', function () {
  let medicinesApp: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    medicinesApp = moduleRef.createNestApplication();
    medicinesApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await medicinesApp.init();
    await medicinesApp.listen(process.env.TEST_PORT);
    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await medicinesApp.close();
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
        name: 'Mara Moja',
        doseForm: DoseForms.TABLETS,
        strength: '250mg',
        levelOfUse: 3,
        therapeuticClass: 'Pain Killers',
        packSize: 'Box',
      };

      describe('Add Medicine', function () {
        it('should create a medicine', function () {
          return pactum
            .spec()
            .post('/medicines')
            .withHeaders({
              Authorization: 'Bearer $S{accessToken}',
            })
            .withBody({ ...medicineDto })
            .expectStatus(201)
            .stores('medicineId', 'id')
            .inspect();
        });
      });

      describe('View Medicines', function () {
        it('should return an array of medicines', function () {
          return pactum
            .spec()
            .get('/medicines')
            .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
            .expectStatus(200)
            .inspect();
        });
      });
    });
  });
});
