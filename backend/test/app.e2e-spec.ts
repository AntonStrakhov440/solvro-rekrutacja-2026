import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Solvro API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication flow (/auth)', () => {
    const uniqueEmail = `e2e_test_${Date.now()}@solvro.pwr.edu.pl`;
    const password = 'Password123!';

    it('should register a new user: POST /auth/register', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          username: 'e2eUser',
          password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(uniqueEmail);
      jwtToken = response.body.accessToken;
    });

    it('should reject registration with invalid email: POST /auth/register', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email-format',
          username: 'badUser',
          password,
        })
        .expect(400);
    });

    it('should reject registration when email already exists: POST /auth/register', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          username: 'duplicateUser',
          password,
        })
        .expect(409);
    });

    it('should log in with valid credentials: POST /auth/login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject login with wrong password: POST /auth/login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'WrongPassword!',
        })
        .expect(401);
    });
  });

  describe('Ingredients API (/ingredients)', () => {
    it('should retrieve a paginated list of ingredients: GET /ingredients', async () => {
      const response = await request(app.getHttpServer())
        .get('/ingredients?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });
  });

  describe('Cocktails API (/cocktails)', () => {
    it('should retrieve a paginated list of cocktails: GET /cocktails', async () => {
      const response = await request(app.getHttpServer())
        .get('/cocktails?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.page).toBe(1);
    });

    it('should filter non-alcoholic cocktails: GET /cocktails?isAlcoholic=false', async () => {
      const response = await request(app.getHttpServer())
        .get('/cocktails?isAlcoholic=false')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject cocktail creation without JWT: POST /cocktails', async () => {
      await request(app.getHttpServer())
        .post('/cocktails')
        .send({
          name: 'Unauthorized Cocktail',
          category: 'classic',
          instructions: 'Should fail',
          ingredients: [],
        })
        .expect(401);
    });

    it('should reject cocktail creation with empty ingredients: POST /cocktails', async () => {
      await request(app.getHttpServer())
        .post('/cocktails')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Empty Cocktail',
          category: 'classic',
          instructions: 'Should fail validation',
          ingredients: [],
        })
        .expect(400);
    });
  });
});
