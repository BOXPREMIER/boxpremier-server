import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';
import PaymentModel from '../../src/models/PaymentModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config.js';

describe('Payment Routes', () => {
    let adminToken;
    let customerToken;
    let adminUser;
    let customerUser;
    let plan;
    let subscription;
    let payment;

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
            paymentMethod: { type: 'card' }
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

        payment = await PaymentModel.create({
            subscriptionId: subscription._id,
            amount: 29.99,
            status: 'pending',
            gateway: 'multisafepay',
            paymentType: 'recurring',
            monthsPaid: 1
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('POST /api/payments', () => {
        it('should create payment successfully', async () => {
            const response = await request(app)
                .post('/api/payments')
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionId: subscription._id,
                    amount: 29.99,
                    gateway: 'paypal'
                })
                .expect(201);

            expect(response.body.data.amount).toBe(29.99);
            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.gateway).toBe('paypal');
        });

        it('should return 404 when subscription not found', async () => {
            await request(app)
                .post('/api/payments')
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionId: '507f1f77bcf86cd799439011',
                    amount: 29.99,
                    gateway: 'paypal'
                })
                .expect(404);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .post('/api/payments')
                .set('Content-Type', 'application/json')
                .send({
                    subscriptionId: subscription._id,
                    amount: 29.99,
                    gateway: 'paypal'
                })
                .expect(401);
        });
    });

    describe('GET /api/payments', () => {
        it('should return customer payments only', async () => {
            const response = await request(app)
                .get('/api/payments')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
        });

        it('should return all payments for admin', async () => {
            const response = await request(app)
                .get('/api/payments')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .get('/api/payments')
                .expect(401);
        });
    });

    describe('GET /api/payments/:id', () => {
        it('should allow customer to get own payment', async () => {
            const response = await request(app)
                .get(`/api/payments/${payment._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(payment._id.toString());
        });

        it('should allow admin to get any payment', async () => {
            const response = await request(app)
                .get(`/api/payments/${payment._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(payment._id.toString());
        });

        it('should return 404 when payment not found', async () => {
            await request(app)
                .get('/api/payments/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('PATCH /api/payments/:id/status', () => {
        it('should allow admin to update payment status', async () => {
            const response = await request(app)
                .patch(`/api/payments/${payment._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({
                    status: 'completed',
                    transactionId: 'TXN123456'
                })
                .expect(200);

            expect(response.body.data.status).toBe('completed');
            expect(response.body.data.transactionId).toBe('TXN123456');
            expect(response.body.data.paymentDate).toBeDefined();
        });

        it('should return 403 when customer tries to update', async () => {
            await request(app)
                .patch(`/api/payments/${payment._id}/status`)
                .set('Authorization', `Bearer ${customerToken}`)
                .set('Content-Type', 'application/json')
                .send({ status: 'completed' })
                .expect(403);
        });

        it('should return 404 when payment not found', async () => {
            await request(app)
                .patch('/api/payments/507f1f77bcf86cd799439011/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({ status: 'completed' })
                .expect(404);
        });
    });
});