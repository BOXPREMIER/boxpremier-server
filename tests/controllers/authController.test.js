import { registerController, loginController } from '../../src/controllers/AuthController.js';
import UserModel from '../../src/models/UserModel.js';
import bcrypt from 'bcrypt';

describe('AuthController', () => {
    let req, res, originalFindOne, originalCreate, originalFindById;

    beforeEach(() => {
        req = { body: {} };
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

    describe('registerController', () => {
        it('should register a new user successfully', async () => {
            req.body = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@test.com',
                password: 'password123',
                phone: '123456789',
                street: 'Street',
                number: '123',
                postalCode: '12345',
                city: 'City',
                province: 'Province',
                country: 'Country'
            };

            const mockUser = { _id: '123', email: 'john@test.com', userType: 'customer' };

            originalFindOne = UserModel.findOne;
            originalCreate = UserModel.create;
            originalFindById = UserModel.findById;

            UserModel.findOne = async () => null;
            UserModel.create = async () => mockUser;
            UserModel.findById = () => ({ select: async () => mockUser });

            await registerController(req, res);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.token).toBeDefined();

            UserModel.findOne = originalFindOne;
            UserModel.create = originalCreate;
            UserModel.findById = originalFindById;
        });

        it('should return 400 when email already exists', async () => {
            req.body = { email: 'existing@test.com', password: 'password123' };

            originalFindOne = UserModel.findOne;
            UserModel.findOne = async () => ({ email: 'existing@test.com' });

            await registerController(req, res);

            expect(res.statusCode).toBe(400);

            UserModel.findOne = originalFindOne;
        });
    });

    describe('loginController', () => {
        it('should login successfully with valid credentials', async () => {
            req.body = { email: 'test@test.com', password: 'password123' };

            const mockUser = {
                _id: '123',
                email: 'test@test.com',
                password: await bcrypt.hash('password123', 10),
                userType: 'customer'
            };

            originalFindOne = UserModel.findOne;
            originalFindById = UserModel.findById;

            UserModel.findOne = async () => mockUser;
            UserModel.findById = () => ({ select: async () => ({ _id: '123', email: 'test@test.com' }) });

            await loginController(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.token).toBeDefined();

            UserModel.findOne = originalFindOne;
            UserModel.findById = originalFindById;
        });

        it('should return 401 when user not found', async () => {
            req.body = { email: 'nonexistent@test.com', password: 'password123' };

            originalFindOne = UserModel.findOne;
            UserModel.findOne = async () => null;

            await loginController(req, res);

            expect(res.statusCode).toBe(401);

            UserModel.findOne = originalFindOne;
        });

        it('should return 401 when password is invalid', async () => {
            req.body = { email: 'test@test.com', password: 'wrongpassword' };

            const mockUser = {
                _id: '123',
                email: 'test@test.com',
                password: await bcrypt.hash('password123', 10)
            };

            originalFindOne = UserModel.findOne;
            UserModel.findOne = async () => mockUser;

            await loginController(req, res);

            expect(res.statusCode).toBe(401);

            UserModel.findOne = originalFindOne;
        });

        it('should return 400 when email or password missing', async () => {
            req.body = { email: 'test@test.com' };

            await loginController(req, res);

            expect(res.statusCode).toBe(400);
        });
    });
});