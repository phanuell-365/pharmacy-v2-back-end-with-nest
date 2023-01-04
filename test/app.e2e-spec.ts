import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { CreateUserDto, UpdateUserDto } from '../src/users/dto';
import { Role } from '../src/users/enums';
import { AuthDto } from '../src/auth/dto';

describe('Pharmacy Version 2 App e2e', function () {
  let app: INestApplication;

  jest.setTimeout(15000);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();

    await app.listen(process.env.TEST_PORT);

    pactum.request.setBaseUrl(`http://localhost:${process.env.TEST_PORT}`);
  });

  afterAll(async () => {
    await app.close();
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

  describe('User', function () {
    const newUser: CreateUserDto = {
      username: 'Jane Smith',
      email: 'janesmith@localhost.com',
      password: 'password_jane',
      phone: '0712345676',
      role: Role.CHIEF_PHARMACIST,
    };

    describe('Create', function () {
      it('should return a new user', function () {
        return pactum
          .spec()
          .post('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody({ ...newUser })
          .stores('userId', 'id')
          .expectStatus(201);
      });
    });

    describe('Get all users', function () {
      it('should return all users', function () {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200);
      });
    });

    describe('Get a user', function () {
      it('should return a user', function () {
        return pactum
          .spec()
          .get('/users/{id}')
          .withPathParams('id', '$S{userId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .expectBodyContains(newUser.username);
      });
    });

    describe('Update a user', function () {
      const updateUser: UpdateUserDto = {
        username: 'Jane Miller',
        email: 'janemiller@localhost.com',
      };
      it('should return the updated user', function () {
        return pactum
          .spec()
          .patch('/users/{id}')
          .withPathParams('id', '$S{userId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody({ ...updateUser })
          .expectStatus(200)
          .expectBodyContains(updateUser.username);
      });
    });
    describe('Delete a user', function () {
      it('should delete a user', function () {
        return pactum
          .spec()
          .delete('/users/{id}')
          .withPathParams('id', '$S{userId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(204);
      });
    });

    describe('Create', function () {
      const newUser: CreateUserDto = {
        username: 'Mary Smith',
        email: 'marysmith@localhost.com',
        password: 'password_mary',
        phone: '0712345478',
        // role: Role.PHARMACIST_ASSISTANT,
        role: Role.CHIEF_PHARMACIST,
      };

      it('should return a new user', function () {
        return pactum
          .spec()
          .post('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody({ ...newUser })
          .stores('user2Id', 'id')
          .expectStatus(201);
      });
    });

    describe('List all users', function () {
      it('should return an array of users', function () {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Login another user', function () {
      const authDto: AuthDto = {
        username: 'Mary Smith',
        password: 'password_mary',
      };

      it('should login another user and return a token', function () {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...authDto })
          .expectStatus(201)
          .stores('user2AccessToken', 'access_token');
      });

      it('should fail to fetch users', function () {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{user2AccessToken}',
          })
          .expectStatus(403)
          .inspect();
      });

      const updateUser: UpdateUserDto = {
        role: Role.CHIEF_PHARMACIST,
      };
      it('should return the updated user', function () {
        return pactum
          .spec()
          .patch('/users/{id}')
          .withPathParams('id', '$S{user2Id}')
          .withHeaders({
            Authorization: 'Bearer $S{user2AccessToken}',
          })
          .withBody({ ...updateUser })
          .expectStatus(403)
          .inspect();
      });
    });

    describe('List all users', function () {
      it('should return an array of users', function () {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .inspect();
      });
    });
  });
});
