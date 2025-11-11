import { createSubscription, getUserSubscriptions, cancelSubscription } from '../../src/controllers/SubscriptionController.js';
import SubscriptionModel from '../../src/models/SubscriptionModel.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';
import UserModel from '../../src/models/UserModel.js';

describe('SubscriptionController', () => {
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

    describe('createSubscription', () => {
        it('should create subscription successfully', async () => {
            req.body = { subscriptionPlanId: 'plan123', wineType: 'red' };
            req.user = { _id: 'user123', userType: 'customer' };

            const mockPlan = { _id: 'plan123', boxType: 'basic', boxSize: 3, price: 29.99 };
            const mockUser = {
                _id: 'user123',
                paymentMethod: { type: 'card' }
            };
            const mockSubscription = { _id: 'sub123', status: 'pending' };

            const originalPlanFind = SubscriptionPlanModel.findById;
            const originalUserFind = UserModel.findById;
            const originalSubsCreate = SubscriptionModel.create;

            SubscriptionPlanModel.findById = async () => mockPlan;
            UserModel.findById = async () => mockUser;
            SubscriptionModel.create = async () => mockSubscription;

            await createSubscription(req, res);

            expect(res.statusCode).toBe(201);

            SubscriptionPlanModel.findById = originalPlanFind;
            UserModel.findById = originalUserFind;
            SubscriptionModel.create = originalSubsCreate;
        });

        it('should return 404 when plan not found', async () => {
            req.body = { subscriptionPlanId: 'plan123', wineType: 'red' };
            req.user = { _id: 'user123', userType: 'customer' };

            const originalPlanFind = SubscriptionPlanModel.findById;
            SubscriptionPlanModel.findById = async () => null;

            await createSubscription(req, res);

            expect(res.statusCode).toBe(404);

            SubscriptionPlanModel.findById = originalPlanFind;
        });

        it('should return 400 when payment method missing', async () => {
            req.body = { subscriptionPlanId: 'plan123', wineType: 'red' };
            req.user = { _id: 'user123', userType: 'customer' };

            const mockPlan = { _id: 'plan123', boxType: 'basic', boxSize: 3 };
            const mockUser = { _id: 'user123', paymentMethod: null };

            const originalPlanFind = SubscriptionPlanModel.findById;
            const originalUserFind = UserModel.findById;

            SubscriptionPlanModel.findById = async () => mockPlan;
            UserModel.findById = async () => mockUser;

            await createSubscription(req, res);

            expect(res.statusCode).toBe(400);

            SubscriptionPlanModel.findById = originalPlanFind;
            UserModel.findById = originalUserFind;
        });
    });

    describe('getUserSubscriptions', () => {
        it('should return customer subscriptions', async () => {
            req.user = { _id: 'user123', userType: 'customer' };
            req.params = {};

            const mockSubscriptions = [{ _id: 'sub123', user: 'user123' }];

            const originalFind = SubscriptionModel.find;
            SubscriptionModel.find = () => ({
                populate: () => ({
                    populate: () => ({
                        populate: () => ({
                            sort: async () => mockSubscriptions
                        })
                    })
                })
            });

            await getUserSubscriptions(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockSubscriptions);

            SubscriptionModel.find = originalFind;
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel subscription successfully', async () => {
            req.params.id = 'sub123';
            req.user = { _id: 'user123', userType: 'customer' };

            const mockSubscription = {
                _id: 'sub123',
                status: 'active',
                save: async function () {
                    return this;
                }
            };

            const originalFindOne = SubscriptionModel.findOne;
            SubscriptionModel.findOne = async () => mockSubscription;

            await cancelSubscription(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockSubscription.status).toBe('canceled');

            SubscriptionModel.findOne = originalFindOne;
        });

        it('should return 400 when already canceled', async () => {
            req.params.id = 'sub123';
            req.user = { _id: 'user123', userType: 'customer' };

            const mockSubscription = { _id: 'sub123', status: 'canceled' };

            const originalFindOne = SubscriptionModel.findOne;
            SubscriptionModel.findOne = async () => mockSubscription;

            await cancelSubscription(req, res);

            expect(res.statusCode).toBe(400);

            SubscriptionModel.findOne = originalFindOne;
        });
    });
});