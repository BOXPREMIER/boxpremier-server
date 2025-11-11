import { getAllOrders, getOrderById, createOrder, updateOrderStatus, updateOrderAddress, updateOrderTracking, cancelOrder, deleteOrder } from '../../src/controllers/OrderController.js';
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

        it('should return 404 when user not found', async () => {
            req.body = { userId: 'user123', subscriptionId: 'sub123' };
            req.user = { userType: 'admin' };

            const originalUserFind = UserModel.findById;
            UserModel.findById = async () => null;

            await createOrder(req, res);

            expect(res.statusCode).toBe(404);

            UserModel.findById = originalUserFind;
        });

        it('should return 404 when subscription not found', async () => {
            req.body = { userId: 'user123', subscriptionId: 'sub123' };
            req.user = { userType: 'admin' };

            const mockUser = { _id: 'user123' };

            const originalUserFind = UserModel.findById;
            const originalSubsFind = SubscriptionModel.findById;

            UserModel.findById = async () => mockUser;
            SubscriptionModel.findById = async () => null;

            await createOrder(req, res);

            expect(res.statusCode).toBe(404);

            UserModel.findById = originalUserFind;
            SubscriptionModel.findById = originalSubsFind;
        });
    });

    describe('updateOrderStatus', () => {
        it('should update order status successfully', async () => {
            req.params.id = 'order123';
            req.body = { status: 'preparing' };
            req.user = { _id: 'admin123' };

            const mockOrder = {
                _id: 'order123',
                status: 'pending',
                save: async function () { return this; }
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderStatus(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockOrder.status).toBe('preparing');

            OrderModel.findById = originalFind;
        });

        it('should return 404 when order not found', async () => {
            req.params.id = 'order123';
            req.body = { status: 'preparing' };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => null;

            await updateOrderStatus(req, res);

            expect(res.statusCode).toBe(404);

            OrderModel.findById = originalFind;
        });

        it('should return 403 when order already delivered', async () => {
            req.params.id = 'order123';
            req.body = { status: 'cancelled' };

            const mockOrder = {
                _id: 'order123',
                status: 'delivered'
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderStatus(req, res);

            expect(res.statusCode).toBe(403);

            OrderModel.findById = originalFind;
        });

        it('should return error when shipping without tracking', async () => {
            req.params.id = 'order123';
            req.body = { status: 'shipped' };

            const mockOrder = {
                _id: 'order123',
                status: 'preparing',
                trackingNumber: null,
                carrier: null
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderStatus(req, res);

            expect(res.statusCode).toBe(500);

            OrderModel.findById = originalFind;
        });
    });

    describe('updateOrderAddress', () => {
        it('should update address successfully', async () => {
            req.params.id = 'order123';
            req.body = { street: 'New Street', city: 'New City' };
            req.user = { _id: 'admin123' };

            const mockOrder = {
                _id: 'order123',
                status: 'pending',
                street: 'Old Street',
                city: 'Old City',
                save: async function () { return this; }
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderAddress(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockOrder.street).toBe('New Street');
            expect(mockOrder.city).toBe('New City');

            OrderModel.findById = originalFind;
        });

        it('should return 404 when order not found', async () => {
            req.params.id = 'order123';
            req.body = { street: 'New Street' };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => null;

            await updateOrderAddress(req, res);

            expect(res.statusCode).toBe(404);

            OrderModel.findById = originalFind;
        });

        it('should return 403 when order is delivered', async () => {
            req.params.id = 'order123';
            req.body = { street: 'New Street' };

            const mockOrder = {
                _id: 'order123',
                status: 'delivered'
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderAddress(req, res);

            expect(res.statusCode).toBe(403);

            OrderModel.findById = originalFind;
        });
    });

    describe('updateOrderTracking', () => {
        it('should update tracking successfully', async () => {
            req.params.id = 'order123';
            req.body = { trackingNumber: 'TRACK123', carrier: 'DHL' };
            req.user = { _id: 'admin123' };

            const mockOrder = {
                _id: 'order123',
                trackingNumber: null,
                carrier: null,
                save: async function () { return this; }
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await updateOrderTracking(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockOrder.trackingNumber).toBe('TRACK123');
            expect(mockOrder.carrier).toBe('DHL');

            OrderModel.findById = originalFind;
        });

        it('should return 404 when order not found', async () => {
            req.params.id = 'order123';
            req.body = { trackingNumber: 'TRACK123' };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => null;

            await updateOrderTracking(req, res);

            expect(res.statusCode).toBe(404);

            OrderModel.findById = originalFind;
        });
    });

    describe('cancelOrder', () => {
        it('should cancel order successfully', async () => {
            req.params.id = 'order123';
            req.user = { _id: 'admin123' };

            const mockOrder = {
                _id: 'order123',
                status: 'pending',
                save: async function () { return this; }
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await cancelOrder(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockOrder.status).toBe('cancelled');

            OrderModel.findById = originalFind;
        });

        it('should return 404 when order not found', async () => {
            req.params.id = 'order123';

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => null;

            await cancelOrder(req, res);

            expect(res.statusCode).toBe(404);

            OrderModel.findById = originalFind;
        });

        it('should return 403 when order cannot be cancelled', async () => {
            req.params.id = 'order123';

            const mockOrder = {
                _id: 'order123',
                status: 'shipped'
            };

            const originalFind = OrderModel.findById;
            OrderModel.findById = async () => mockOrder;

            await cancelOrder(req, res);

            expect(res.statusCode).toBe(403);

            OrderModel.findById = originalFind;
        });
    });
});