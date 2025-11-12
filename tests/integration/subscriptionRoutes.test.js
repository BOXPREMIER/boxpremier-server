import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config.js';

describe('Subscription Routes', () => {
    let adminToken;
    let customerToken;
    let adminUser;
    let customerUser;
    let plan;
    let subscription;

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
            country: 'Test Country',
            paymentMethod: {
                type: 'card',
                lastFourDigits: '1234'
            }
        });

        plan = await SubscriptionPlanModel.create({
            boxType: 'basic',
            boxSize: 3,
            price: 29.99,
            active: true
        });

        subscription = await SubscriptionModel.create({
            user: customerUser._id,
            subscriptionPlan: plan._id,
            boxType: 'basic',
            boxSize: 3,
            wineType: 'mixed',
            status: 'active',
            startDate: new Date(),
            nextPayDate: new Date(),
            payMethod: 'card'
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('POST /api/subs', () => {
        it('should create subscription for customer', async () => {
            const response = await request(app)
                .post('/api/subs')
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionPlanId: plan._id,
                    wineType: 'red'
                })
                .expect(201);

            expect(response.body.data.wineType).toBe('red');
            expect(response.body.data.status).toBe('pending');
        });

        it('should return 400 when payment method missing', async () => {
            const userWithoutPayment = await UserModel.create({
                userType: 'customer',
                email: 'nopay@test.com',
                password: await bcrypt.hash('password123', 10),
                firstName: 'No',
                lastName: 'Payment',
                phone: '987654321',
                street: 'Street',
                number: '1',
                postalCode: '12345',
                city: 'City',
                province: 'Province',
                country: 'Country'
            });

            const tokenNoPay = jwt.sign({ id: userWithoutPayment._id, userType: 'customer' }, JWT_SECRET);

            await request(app)
                .post('/api/subs')
                .set('Authorization', `Bearer ${tokenNoPay}`)
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionPlanId: plan._id,
                    wineType: 'red'
                })
                .expect(400);
        });

        it('should return 404 when plan not found', async () => {
            await request(app)
                .post('/api/subs')
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionPlanId: '507f1f77bcf86cd799439011',
                    wineType: 'red'
                })
                .expect(404);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .post('/api/subs')
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionPlanId: plan._id,
                    wineType: 'red'
                })
                .expect(401);
        });
    });

    describe('GET /api/subs', () => {
        it('should return customer subscriptions', async () => {
            const response = await request(app)
                .get('/api/subs')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].user._id).toBe(customerUser._id.toString());
        });

        it('should return all subscriptions for admin', async () => {
            const response = await request(app)
                .get('/api/subs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/subs/details/:id', () => {
        it('should allow customer to get own subscription', async () => {
            const response = await request(app)
                .get(`/api/subs/details/${subscription._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(subscription._id.toString());
        });

        it('should return 404 when subscription not found', async () => {
            await request(app)
                .get('/api/subs/details/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/subs/:id', () => {
        it('should allow customer to update wine type', async () => {
            const response = await request(app)
                .put(`/api/subs/${subscription._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({ wineType: 'sparkling' })
                .expect(200);

            expect(response.body.data.wineType).toBe('sparkling');
        });

        it('should not allow customer to update status', async () => {
            const response = await request(app)
                .put(`/api/subs/${subscription._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({ status: 'canceled' })
                .expect(200);

            expect(response.body.data.status).not.toBe('canceled');
        });

        it('should allow admin to update status', async () => {
            const response = await request(app)
                .put(`/api/subs/${subscription._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({ status: 'paused' })
                .expect(200);

            expect(response.body.data.status).toBe('paused');
        });
    });

    describe('DELETE /api/subs/:id', () => {
        it('should allow customer to cancel own subscription', async () => {
            const response = await request(app)
                .delete(`/api/subs/${subscription._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(200);

            expect(response.body.data.status).toBe('canceled');
        });

        it('should return 400 when already canceled', async () => {
            subscription.status = 'canceled';
            await subscription.save();

            await request(app)
                .delete(`/api/subs/${subscription._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(400);
        });
    });
});