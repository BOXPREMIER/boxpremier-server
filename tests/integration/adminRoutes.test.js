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

describe('Admin Routes', () => {
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

        const plan = await SubscriptionPlanModel.create({
            boxType: 'basic',
            boxSize: 3,
            price: 29.99,
            active: true
        });

        const subscription = await SubscriptionModel.create({
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

        await OrderModel.create({
            userId: customerUser._id,
            subscriptionId: subscription._id,
            boxType: 'basic',
            wineType: 'red',
            boxSize: 3,
            fullName: 'Customer User',
            phone: '123456789',
            street: 'Test Street',
            number: '123',
            postalCode: '12345',
            city: 'Test City',
            province: 'Test Province',
            country: 'Test Country',
            status: 'delivered',
            orderDate: new Date(),
            totalAmount: 29.99
        });

        await OrderModel.create({
            userId: customerUser._id,
            subscriptionId: subscription._id,
            boxType: 'premium',
            wineType: 'sparkling',
            boxSize: 6,
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
            totalAmount: 59.99
        });

        adminToken = jwt.sign({ id: adminUser._id, userType: 'admin' }, JWT_SECRET);
        customerToken = jwt.sign({ id: customerUser._id, userType: 'customer' }, JWT_SECRET);
    });

    describe('GET /api/dashboard/metrics/boxes-by-type', () => {
        it('should return boxes metrics for admin', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics/boxes-by-type')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('basic');
            expect(response.body.data).toHaveProperty('premium');
        });

        it('should filter by status', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics/boxes-by-type?status=delivered')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.basic).toBe(1);
        });

        it('should return 403 when customer tries to access', async () => {
            await request(app)
                .get('/api/dashboard/metrics/boxes-by-type')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    describe('GET /api/dashboard/metrics/wines-by-type', () => {
        it('should return wines metrics for admin', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics/wines-by-type')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('red');
            expect(response.body.data).toHaveProperty('sparkling');
            expect(response.body.data.red).toBe(3);
            expect(response.body.data.sparkling).toBe(6);
        });

        it('should return 403 when customer tries to access', async () => {
            await request(app)
                .get('/api/dashboard/metrics/wines-by-type')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    describe('GET /api/dashboard/metrics/boxes-by-wine-type', () => {
        it('should return boxes by wine type for admin', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics/boxes-by-wine-type')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.red).toBe(1);
            expect(response.body.data.sparkling).toBe(1);
        });

        it('should return 403 when customer tries to access', async () => {
            await request(app)
                .get('/api/dashboard/metrics/boxes-by-wine-type')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    describe('GET /api/dashboard/orders/export-csv', () => {
        it('should export orders as CSV for admin', async () => {
            const response = await request(app)
                .get('/api/dashboard/orders/export-csv')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
            expect(response.headers['content-disposition']).toContain('orders.csv');
            expect(response.text).toContain('Order ID');
            expect(response.text).toContain('Customer User');
        });

        it('should return 403 when customer tries to export', async () => {
            await request(app)
                .get('/api/dashboard/orders/export-csv')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });
});