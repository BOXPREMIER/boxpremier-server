import request from 'supertest';
import app, { server } from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';
import UserModel from '../../src/models/UserModel.js';
import OrderModel from '../../src/models/OrderModel.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config.js';

describe('Order Routes', () => {
    let adminToken;
    let customerToken;
    let adminUser;
    let customerUser;
    let subscription;
    let plan;
    let order;

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

        order = await OrderModel.create({
            userId: customerUser._id,
            subscriptionId: subscription._id,
            boxType: 'basic',
            wineType: 'mixed',
            boxSize: 3,
            fullName: 'Customer User',
            phone: '123456789',
            street: 'Test Street',
            number: '123',
            postalCode: '12345',
            city: 'Test City',
            province: 'Test Province',
            country: 'Test Country',
            status: 'pending',
            orderDate: new Date(),
            totalAmount: 29.99
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('GET /api/orders', () => {
        it('should return all orders for admin', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
        });

        it('should return only customer orders for customer', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].userId.toString()).toBe(customerUser._id.toString());
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .get('/api/orders')
                .expect(401);
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should allow customer to get own order', async () => {
            const response = await request(app)
                .get(`/api/orders/${order._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(order._id.toString());
        });

        it('should allow admin to get any order', async () => {
            const response = await request(app)
                .get(`/api/orders/${order._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(order._id.toString());
        });

        it('should return 404 for non-existent order', async () => {
            await request(app)
                .get('/api/orders/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('POST /api/orders', () => {
        it('should allow admin to create order', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userId: customerUser._id,
                    subscriptionId: subscription._id
                })
                .expect(201);

            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.totalAmount).toBe(29.99);
        });

        it('should return 403 when customer tries to create order', async () => {
            await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    userId: customerUser._id,
                    subscriptionId: subscription._id
                })
                .expect(403);
        });

        it('should return 404 when user not found', async () => {
            await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userId: '507f1f77bcf86cd799439011',
                    subscriptionId: subscription._id
                })
                .expect(404);
        });
    });

    describe('PATCH /api/orders/:id/status', () => {
        it('should allow admin to update order status', async () => {
            const response = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'preparing' })
                .expect(200);

            expect(response.body.data.status).toBe('preparing');
        });

        it('should return 403 when customer tries to update status', async () => {
            await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ status: 'preparing' })
                .expect(403);
        });

        it('should return 400 with invalid status', async () => {
            await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid' })
                .expect(400);
        });
    });

    describe('PATCH /api/orders/:id/cancel', () => {
        it('should allow admin to cancel pending order', async () => {
            const response = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(200);

            expect(response.body.data.status).toBe('cancelled');
        });

        it('should return 403 when trying to cancel shipped order', async () => {
            order.status = 'shipped';
            await order.save();

            await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(403);
        });
    });

    describe('DELETE /api/orders/:id', () => {
        it('should allow admin to delete order', async () => {
            await request(app)
                .delete(`/api/orders/${order._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deletedOrder = await OrderModel.findById(order._id);
            expect(deletedOrder).toBeNull();
        });

        it('should return 403 when customer tries to delete', async () => {
            await request(app)
                .delete(`/api/orders/${order._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });
});