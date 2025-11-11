import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config.js';

describe('SubscriptionPlan Routes', () => {
    let adminToken;
    let customerToken;
    let adminUser;
    let customerUser;
    let plan;

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

        plan = await SubscriptionPlanModel.create({
            boxType: 'basic',
            boxSize: 3,
            price: 29.99,
            active: true
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('POST /api/plans', () => {
        it('should allow admin to create plan', async () => {
            const response = await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    boxType: 'premium',
                    boxSize: 6,
                    price: 59.99,
                    active: true
                })
                .expect(201);

            expect(response.body.data.boxType).toBe('premium');
            expect(response.body.data.price).toBe(59.99);
        });

        it('should return 403 when customer tries to create', async () => {
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    boxType: 'premium',
                    boxSize: 6,
                    price: 59.99,
                    active: true
                })
                .expect(403);
        });

        it('should return 400 when duplicate plan exists', async () => {
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    boxType: 'basic',
                    boxSize: 3,
                    price: 29.99,
                    active: true
                })
                .expect(400);
        });

        it('should return 400 when required fields missing', async () => {
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    boxType: 'premium'
                })
                .expect(400);
        });
    });

    describe('GET /api/plans', () => {
        it('should return all plans for admin', async () => {
            await SubscriptionPlanModel.create({
                boxType: 'premium',
                boxSize: 6,
                price: 59.99,
                active: false
            });

            const response = await request(app)
                .get('/api/plans')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should return only active plans for customer', async () => {
            await SubscriptionPlanModel.create({
                boxType: 'premium',
                boxSize: 6,
                price: 59.99,
                active: false
            });

            const response = await request(app)
                .get('/api/plans')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].active).toBe(true);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .get('/api/plans')
                .expect(401);
        });
    });

    describe('GET /api/plans/:id', () => {
        it('should return plan by id', async () => {
            const response = await request(app)
                .get(`/api/plans/${plan._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(plan._id.toString());
        });

        it('should return 404 when plan not found', async () => {
            await request(app)
                .get('/api/plans/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/plans/:id', () => {
        it('should allow admin to update plan', async () => {
            const response = await request(app)
                .put(`/api/plans/${plan._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({ price: 39.99 })
                .expect(200);

            expect(response.body.data.price).toBe(39.99);
        });

        it('should return 403 when customer tries to update', async () => {
            await request(app)
                .put(`/api/plans/${plan._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({ price: 39.99 })
                .expect(403);
        });

        it('should return 404 when plan not found', async () => {
            await request(app)
                .put('/api/plans/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({ price: 39.99 })
                .expect(404);
        });
    });

    describe('DELETE /api/plans/:id', () => {
        it('should allow admin to soft delete plan', async () => {
            await request(app)
                .delete(`/api/plans/${plan._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(200);

            const deletedPlan = await SubscriptionPlanModel.findById(plan._id);
            expect(deletedPlan).toBeNull();
        });

        it('should return 403 when customer tries to delete', async () => {
            await request(app)
                .delete(`/api/plans/${plan._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(403);
        });
    });
});