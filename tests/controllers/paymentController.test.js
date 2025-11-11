import { createPayment, getAllPayments, getPaymentById, updatePaymentStatus } from '../../src/controllers/PaymentController.js';
import PaymentModel from '../../src/models/PaymentModel.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';

describe('PaymentController', () => {
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

    describe('createPayment', () => {
        it('should create payment successfully', async () => {
            req.body = { subscriptionId: 'sub123', amount: 29.99, gateway: 'paypal' };
            req.user = { _id: 'user123', userType: 'customer' };

            const mockSubscription = {
                _id: 'sub123',
                user: { equals: () => true },
                isGift: false
            };
            const mockPayment = { _id: 'pay123', status: 'pending' };

            const originalSubsFind = SubscriptionModel.findById;
            const originalPayCreate = PaymentModel.create;

            SubscriptionModel.findById = async () => mockSubscription;
            PaymentModel.create = async () => mockPayment;

            await createPayment(req, res);

            expect(res.statusCode).toBe(201);
            expect(res.body.data).toEqual(mockPayment);

            SubscriptionModel.findById = originalSubsFind;
            PaymentModel.create = originalPayCreate;
        });

        it('should return 404 when subscription not found', async () => {
            req.body = { subscriptionId: 'sub123', amount: 29.99, gateway: 'paypal' };
            req.user = { _id: 'user123', userType: 'customer' };

            const originalSubsFind = SubscriptionModel.findById;
            SubscriptionModel.findById = async () => null;

            await createPayment(req, res);

            expect(res.statusCode).toBe(404);

            SubscriptionModel.findById = originalSubsFind;
        });

        it('should return 403 when not owner', async () => {
            req.body = { subscriptionId: 'sub123', amount: 29.99, gateway: 'paypal' };
            req.user = { _id: 'user123', userType: 'customer' };

            const mockSubscription = {
                _id: 'sub123',
                user: { equals: () => false }
            };

            const originalSubsFind = SubscriptionModel.findById;
            SubscriptionModel.findById = async () => mockSubscription;

            await createPayment(req, res);

            expect(res.statusCode).toBe(403);

            SubscriptionModel.findById = originalSubsFind;
        });
    });

    describe('getAllPayments', () => {
        it('should return all payments for admin', async () => {
            req.user = { userType: 'admin' };

            const mockPayments = [{ _id: 'pay123', amount: 29.99 }];

            const originalFind = PaymentModel.find;
            PaymentModel.find = () => ({
                populate: () => ({
                    populate: () => ({
                        sort: async () => mockPayments
                    })
                })
            });

            await getAllPayments(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockPayments);

            PaymentModel.find = originalFind;
        });

        it('should return only customer payments', async () => {
            req.user = { _id: 'user123', userType: 'customer' };

            const mockSubscriptions = [{ _id: 'sub123' }];
            const mockPayments = [{ _id: 'pay123', subscriptionId: 'sub123' }];

            const originalSubsFind = SubscriptionModel.find;
            const originalPayFind = PaymentModel.find;

            SubscriptionModel.find = async () => mockSubscriptions;
            PaymentModel.find = () => ({
                populate: () => ({
                    populate: () => ({
                        sort: async () => mockPayments
                    })
                })
            });

            await getAllPayments(req, res);

            expect(res.statusCode).toBe(200);

            SubscriptionModel.find = originalSubsFind;
            PaymentModel.find = originalPayFind;
        });
    });

    describe('updatePaymentStatus', () => {
        it('should update payment status successfully', async () => {
            req.params.id = 'pay123';
            req.body = { status: 'completed', transactionId: 'TXN123' };

            const mockPayment = {
                _id: 'pay123',
                status: 'pending',
                save: async function () {
                    return this;
                }
            };

            const originalFind = PaymentModel.findById;
            PaymentModel.findById = async () => mockPayment;

            await updatePaymentStatus(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockPayment.status).toBe('completed');
            expect(mockPayment.transactionId).toBe('TXN123');

            PaymentModel.findById = originalFind;
        });

        it('should return 404 when payment not found', async () => {
            req.params.id = 'pay123';
            req.body = { status: 'completed' };

            const originalFind = PaymentModel.findById;
            PaymentModel.findById = async () => null;

            await updatePaymentStatus(req, res);

            expect(res.statusCode).toBe(404);

            PaymentModel.findById = originalFind;
        });
    });
});