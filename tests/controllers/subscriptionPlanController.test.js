import { createPlan, getAllPlans, updatePlan, deletePlan } from '../../src/controllers/SubscriptionPlanController.js';
import SubscriptionPlanModel from '../../src/models/SubscriptionPlanModel.js';

describe('SubscriptionPlanController', () => {
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

    describe('createPlan', () => {
        it('should create plan when admin', async () => {
            req.body = { boxType: 'premium', boxSize: 6, price: 59.99, active: true };
            req.user = { userType: 'admin' };

            const mockPlan = { _id: 'plan123', boxType: 'premium', price: 59.99 };

            const originalFindOne = SubscriptionPlanModel.findOne;
            const originalCreate = SubscriptionPlanModel.create;

            SubscriptionPlanModel.findOne = async () => null;
            SubscriptionPlanModel.create = async () => mockPlan;

            await createPlan(req, res);

            expect(res.statusCode).toBe(201);
            expect(res.body.data).toEqual(mockPlan);

            SubscriptionPlanModel.findOne = originalFindOne;
            SubscriptionPlanModel.create = originalCreate;
        });

        it('should return 403 when not admin', async () => {
            req.user = { userType: 'customer' };

            await createPlan(req, res);

            expect(res.statusCode).toBe(403);
        });

        it('should return 400 when duplicate plan exists', async () => {
            req.body = { boxType: 'basic', boxSize: 3, price: 29.99, active: true };
            req.user = { userType: 'admin' };

            const originalFindOne = SubscriptionPlanModel.findOne;
            SubscriptionPlanModel.findOne = async () => ({ _id: 'existing' });

            await createPlan(req, res);

            expect(res.statusCode).toBe(400);

            SubscriptionPlanModel.findOne = originalFindOne;
        });
    });

    describe('getAllPlans', () => {
        it('should return all plans for admin', async () => {
            req.user = { userType: 'admin' };

            const mockPlans = [
                { _id: 'plan1', boxType: 'basic', active: true },
                { _id: 'plan2', boxType: 'premium', active: false }
            ];

            const originalFind = SubscriptionPlanModel.find;
            SubscriptionPlanModel.find = () => ({
                sort: async () => mockPlans
            });

            await getAllPlans(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockPlans);

            SubscriptionPlanModel.find = originalFind;
        });

        it('should return only active plans for customer', async () => {
            req.user = { userType: 'customer' };

            const mockPlans = [{ _id: 'plan1', boxType: 'basic', active: true }];

            const originalFind = SubscriptionPlanModel.find;
            SubscriptionPlanModel.find = () => ({
                sort: async () => mockPlans
            });

            await getAllPlans(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockPlans);

            SubscriptionPlanModel.find = originalFind;
        });
    });

    describe('updatePlan', () => {
        it('should update plan when admin', async () => {
            req.params.id = 'plan123';
            req.body = { price: 39.99 };
            req.user = { userType: 'admin' };

            const mockPlan = {
                _id: 'plan123',
                price: 29.99,
                save: async function () {
                    return this;
                }
            };

            const originalFind = SubscriptionPlanModel.findById;
            SubscriptionPlanModel.findById = async () => mockPlan;

            await updatePlan(req, res);

            expect(res.statusCode).toBe(200);
            expect(mockPlan.price).toBe(39.99);

            SubscriptionPlanModel.findById = originalFind;
        });

        it('should return 403 when not admin', async () => {
            req.user = { userType: 'customer' };

            await updatePlan(req, res);

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 when plan not found', async () => {
            req.params.id = 'plan123';
            req.user = { userType: 'admin' };

            const originalFind = SubscriptionPlanModel.findById;
            SubscriptionPlanModel.findById = async () => null;

            await updatePlan(req, res);

            expect(res.statusCode).toBe(404);

            SubscriptionPlanModel.findById = originalFind;
        });
    });

    describe('deletePlan', () => {
        it('should soft delete plan when admin', async () => {
            req.params.id = 'plan123';
            req.user = { userType: 'admin' };

            const mockPlan = {
                _id: 'plan123',
                softDelete: async function () {
                    return this;
                }
            };

            const originalFind = SubscriptionPlanModel.findById;
            SubscriptionPlanModel.findById = async () => mockPlan;

            await deletePlan(req, res);

            expect(res.statusCode).toBe(200);

            SubscriptionPlanModel.findById = originalFind;
        });

        it('should return 403 when not admin', async () => {
            req.user = { userType: 'customer' };

            await deletePlan(req, res);

            expect(res.statusCode).toBe(403);
        });
    });
});