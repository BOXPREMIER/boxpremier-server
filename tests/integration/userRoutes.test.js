import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config.js';

describe('User Routes', () => {
    let adminToken;
    let customerToken;
    let adminUser;
    let customerUser;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
        server.close();
    });

    beforeEach(async () => {
        await clearTestDB();

        const hashedPassword = await bcrypt.hash('password123', 10);

        adminUser = await UserModel.create({
            userType: 'admin',
            email: 'admin@test.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User'
        });

        customerUser = await UserModel.create({
            userType: 'customer',
            email: 'customer@test.com',
            password: hashedPassword,
            firstName: 'Customer',
            lastName: 'User',
            phone: '123456789',
            street: 'Test Street',
            number: '123',
            postalCode: '12345',
            city: 'Test City',
            province: 'Test Province',
            country: 'Test Country'
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('GET /api/users', () => {
        it('should get all users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
        });
    });

    describe('POST /api/users', () => {
        it('should create a new customer', async () => {
            const newCustomer = {
                userType: 'customer',
                email: 'newcustomer@test.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'Customer',
                phone: '987654321',
                street: 'New Street',
                number: '456',
                postalCode: '54321',
                city: 'New City',
                province: 'New Province',
                country: 'New Country'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newCustomer)
                .expect(201);

            expect(response.body.data.email).toBe(newCustomer.email);
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should return 403 when customer tries to create user', async () => {
            await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({})
                .expect(403);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .post('/api/users')
                .send({})
                .expect(401);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should allow customer to get own data', async () => {
            const response = await request(app)
                .get(`/api/users/${customerUser._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data.email).toBe('customer@test.com');
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should not allow customer to get other user data', async () => {
            await request(app)
                .get(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });

        it('should allow admin to get any user', async () => {
            const response = await request(app)
                .get(`/api/users/${customerUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.email).toBe('customer@test.com');
        });

        it('should return 404 for non-existent user', async () => {
            await request(app)
                .get('/api/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should allow customer to update own data', async () => {
            const response = await request(app)
                .put(`/api/users/${customerUser._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ firstName: 'Updated' })
                .expect(200);

            expect(response.body.data.firstName).toBe('Updated');
        });

        it('should not allow customer to update other user', async () => {
            await request(app)
                .put(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ firstName: 'Hacked' })
                .expect(403);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should allow admin to delete user', async () => {
            await request(app)
                .delete(`/api/users/${customerUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deletedUser = await UserModel.findById(customerUser._id);
            expect(deletedUser).toBeNull();
        });

        it('should return 403 when customer tries to delete', async () => {
            await request(app)
                .delete(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });
});