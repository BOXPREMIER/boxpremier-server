import { getAllOrders, getOrderById, createOrder } from '../../src/controllers/OrderController.js';
import OrderModel from '../../src/models/OrderModel.js';
import UserModel from '../../src/models/UserModel.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';

describe('OrderController', () => {
    let req, res;

    beforeEach(() => {
        req = { params: {}, body: {}, user: {} };
        res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.body = data;
                return this;
            }
        };
    });

    describe('getAllOrders', () => {
        it('should return all orders for admin', async () => {
            req.user = { userType: 'admin' };

            const mockOrders = [
                { _id: '1', status: 'pending', totalAmount: 29.99 }
            ];

            const originalFind = OrderModel.find;
            OrderModel.find = () => ({
                populate: () => ({
                    populate: () => ({
                        sort: async () => mockOrders
                    })
                })
            });

            await getAllOrders(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockOrders);

            OrderModel.find = originalFind;
        });

        it('should return only customer orders for customer', async () => {
            req.user = { userType: 'customer', _id: '123' };

            const mockOrders = [
                { _id: '1', userId: '123', status: 'pending' }
            ];

            const originalFind = OrderModel.find;
            OrderModel.find = () => ({
                populate: () => ({
                    sort: async () => mockOrders
                })
            });

            await getAllOrders(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockOrders);

            OrderModel.find = originalFind;
        });
    });

    describe('getOrderById', () => {
        it('should return order when admin requests', async () => {
            req.params.id = '123';
            req.user = { userType: 'admin', _id: 'admin123' };

            const mockOrder = {
                _id: '123',
                userId: { _id: '456', equals: () => false },
                status: 'pending'
            };

            const originalFindById = OrderModel.findById;
            OrderModel.findById = () => ({
                populate: () => ({
                    populate: async () => mockOrder
                })
            });

            await getOrderById(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockOrder);

            OrderModel.findById = originalFindById;
        });

        it('should return 403 when customer tries to access other order', async () => {
            req.params.id = '123';
            req.user = { userType: 'customer', _id: '789' };

            const mockOrder = {
                _id: '123',
                userId: {
                    _id: {
                        equals: (id) => id === '456'
                    }
                },
                status: 'pending'
            };

            const originalFindById = OrderModel.findById;
            OrderModel.findById = () => ({
                populate: () => ({
                    populate: async () => mockOrder
                })
            });

            await getOrderById(req, res);

            expect(res.statusCode).toBe(403);

            OrderModel.findById = originalFindById;
        });

        it('should return 404 when order not found', async () => {
            req.params.id = '123';
            req.user = { userType: 'admin' };

            const originalFindById = OrderModel.findById;
            OrderModel.findById = () => ({
                populate: () => ({
                    populate: async () => null
                })
            });

            await getOrderById(req, res);

            expect(res.statusCode).toBe(404);

            OrderModel.findById = originalFindById;
        });
    });

    describe('createOrder', () => {
        it('should create order when admin', async () => {
            req.body = { userId: '123', subscriptionId: '456' };
            req.user = { userType: 'admin', _id: 'admin123' };

            const mockUser = {
                _id: '123',
                firstName: 'John',
                lastName: 'Doe',
                phone: '123456789',
                street: 'Street',
                number: '123',
                postalCode: '12345',
                city: 'City',
                province: 'Province',
                country: 'Country'
            };

            const mockSubscription = {
                _id: '456',
                subscriptionPlan: 'plan123',
                boxType: 'basic',
                boxSize: 3,
                wineType: 'mixed'
            };

            const mockPlan = {
                _id: 'plan123',
                price: 29.99
            };

            const mockOrder = {
                _id: 'order123',
                userId: '123',
                status: 'pending'
            };

            const originalUserFindById = UserModel.findById;
            const originalSubsFindById = SubscriptionModel.findById;
            const originalPlanFindById = SubscriptionPlanModel.findById;
            const originalOrderCreate = OrderModel.create;

            UserModel.findById = async () => mockUser;
            SubscriptionModel.findById = async () => mockSubscription;
            SubscriptionPlanModel.findById = async () => mockPlan;
            OrderModel.create = async () => mockOrder;

            await createOrder(req, res);

            expect(res.statusCode).toBe(201);
            expect(res.body.data).toEqual(mockOrder);

            UserModel.findById = originalUserFindById;
            SubscriptionModel.findById = originalSubsFindById;
            SubscriptionPlanModel.findById = originalPlanFindById;
            OrderModel.create = originalOrderCreate;
        });

        it('should return 403 when customer tries to create', async () => {
            req.user = { userType: 'customer' };

            await createOrder(req, res);

            expect(res.statusCode).toBe(403);
        });
    });
});