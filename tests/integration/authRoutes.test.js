import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import bcrypt from 'bcrypt';

describe('Auth Routes', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
        server.close();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new customer', async () => {
            const newCustomer = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@test.com',
                password: 'password123',
                phone: '123456789',
                street: 'Test Street',
                number: '123',
                postalCode: '12345',
                city: 'Test City',
                province: 'Test Province',
                country: 'Test Country'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(newCustomer)
                .expect(201);

            expect(response.body.data.user.email).toBe(newCustomer.email);
            expect(response.body.data.user).not.toHaveProperty('password');
            expect(response.body.data.token).toBeDefined();
        });

        it('should return 400 when email already exists', async () => {
            const existingUser = {
                userType: 'customer',
                firstName: 'Existing',
                lastName: 'User',
                email: 'existing@test.com',
                password: await bcrypt.hash('password123', 10),
                phone: '123456789',
                street: 'Street',
                number: '123',
                postalCode: '12345',
                city: 'City',
                province: 'Province',
                country: 'Country'
            };

            await UserModel.create(existingUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'existing@test.com',
                    password: 'password123',
                    phone: '987654321',
                    street: 'Other Street',
                    number: '456',
                    postalCode: '54321',
                    city: 'Other City',
                    province: 'Other Province',
                    country: 'Other Country'
                })
                .expect(400);

            expect(response.body.message).toContain('Email already exists');
        });

        it('should return 400 when required fields are missing', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@test.com',
                    password: 'password123'
                })
                .expect(400);
        });

        it('should return 400 when email is invalid', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'invalid-email',
                    password: 'password123',
                    phone: '123456789',
                    street: 'Street',
                    number: '123',
                    postalCode: '12345',
                    city: 'City',
                    province: 'Province',
                    country: 'Country'
                })
                .expect(400);
        });

        it('should return 400 when password is too short', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test@test.com',
                    password: '123',
                    phone: '123456789',
                    street: 'Street',
                    number: '123',
                    postalCode: '12345',
                    city: 'City',
                    province: 'Province',
                    country: 'Country'
                })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await UserModel.create({
                userType: 'customer',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                password: hashedPassword,
                phone: '123456789',
                street: 'Street',
                number: '123',
                postalCode: '12345',
                city: 'City',
                province: 'Province',
                country: 'Country'
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.data.user.email).toBe('test@test.com');
            expect(response.body.data.user).not.toHaveProperty('password');
            expect(response.body.data.token).toBeDefined();
        });

        it('should return 401 with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@test.com',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid credentials');
        });

        it('should return 401 with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid credentials');
        });

        it('should return 400 when email is missing', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'password123'
                })
                .expect(400);
        });

        it('should return 400 when password is missing', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com'
                })
                .expect(400);
        });
    });
});