import { getBoxesByType, getWinesByType, getBoxesByWineType, exportOrdersCSV } from '../../src/controllers/AdminController.js';
import OrderModel from '../../src/models/OrderModel.js';

describe('AdminController', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {} };
        res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.body = data;
                return this;
            },
            setHeader: function () { },
            send: function (data) {
                this.sentData = data;
                return this;
            }
        };
    });

    describe('getBoxesByType', () => {
        it('should return boxes grouped by type', async () => {
            const mockResult = [
                { _id: 'basic', total: 5 },
                { _id: 'premium', total: 3 }
            ];

            const originalAggregate = OrderModel.aggregate;
            OrderModel.aggregate = async () => mockResult;

            await getBoxesByType(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual({ basic: 5, premium: 3 });

            OrderModel.aggregate = originalAggregate;
        });

        it('should filter by status', async () => {
            req.query.status = 'delivered';

            const mockResult = [{ _id: 'basic', total: 2 }];

            const originalAggregate = OrderModel.aggregate;
            OrderModel.aggregate = async () => mockResult;

            await getBoxesByType(req, res);

            expect(res.statusCode).toBe(200);

            OrderModel.aggregate = originalAggregate;
        });
    });

    describe('getWinesByType', () => {
        it('should return wines grouped by type', async () => {
            const mockResult = [
                { _id: 'red', totalBottles: 15 },
                { _id: 'mixed', totalBottles: 12 }
            ];

            const originalAggregate = OrderModel.aggregate;
            OrderModel.aggregate = async () => mockResult;

            await getWinesByType(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual({ red: 15, mixed: 12 });

            OrderModel.aggregate = originalAggregate;
        });
    });

    describe('getBoxesByWineType', () => {
        it('should return boxes grouped by wine type', async () => {
            const mockResult = [
                { _id: 'red', totalBoxes: 5 },
                { _id: 'sparkling', totalBoxes: 3 }
            ];

            const originalAggregate = OrderModel.aggregate;
            OrderModel.aggregate = async () => mockResult;

            await getBoxesByWineType(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual({ red: 5, sparkling: 3 });

            OrderModel.aggregate = originalAggregate;
        });
    });

    describe('exportOrdersCSV', () => {
        it('should export orders as CSV', async () => {
            const mockOrders = [
                {
                    _id: 'order123',
                    userId: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
                    boxType: 'basic',
                    wineType: 'red',
                    boxSize: 3,
                    fullName: 'John Doe',
                    phone: '123456789',
                    street: 'Street',
                    number: '123',
                    postalCode: '12345',
                    city: 'City',
                    province: 'Province',
                    country: 'Country',
                    status: 'delivered',
                    orderDate: new Date('2025-01-01'),
                    totalAmount: 29.99
                }
            ];

            const originalFind = OrderModel.find;
            OrderModel.find = () => ({
                populate: () => ({
                    populate: () => ({
                        sort: async () => mockOrders
                    })
                })
            });

            await exportOrdersCSV(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.sentData).toContain('Order ID');
            expect(res.sentData).toContain('John Doe');

            OrderModel.find = originalFind;
        });
    });
});