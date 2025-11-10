import { getAllUsers, getOneUser, deleteUser } from '../../src/controllers/UserController.js';

describe('UserController', () => {
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

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { _id: '1', email: 'user1@test.com', firstName: 'User', lastName: 'One' }
            ];

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFind = UserModelImport.find;

            UserModelImport.find = function () {
                return {
                    select: async function () {
                        return mockUsers;
                    }
                };
            };

            await getAllUsers(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockUsers);

            UserModelImport.find = originalFind;
        });

        it('should handle errors', async () => {
            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFind = UserModelImport.find;

            UserModelImport.find = function () {
                return {
                    select: async function () {
                        throw new Error('Database error');
                    }
                };
            };

            await getAllUsers(req, res);

            expect(res.statusCode).toBe(500);

            UserModelImport.find = originalFind;
        });
    });

    describe('getOneUser', () => {
        it('should return user when admin requests', async () => {
            req.params.id = '123';
            req.user = { userType: 'admin', _id: { equals: () => false } };

            const mockUser = { _id: '123', email: 'user@test.com' };

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFindById = UserModelImport.findById;

            UserModelImport.findById = function () {
                return {
                    select: async function () {
                        return mockUser;
                    }
                };
            };

            await getOneUser(req, res);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(mockUser);

            UserModelImport.findById = originalFindById;
        });

        it('should return 404 when user not found', async () => {
            req.params.id = '123';
            req.user = { userType: 'admin', _id: { equals: () => false } };

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFindById = UserModelImport.findById;

            UserModelImport.findById = function () {
                return {
                    select: async function () {
                        return null;
                    }
                };
            };

            await getOneUser(req, res);

            expect(res.statusCode).toBe(404);

            UserModelImport.findById = originalFindById;
        });

        it('should return 403 when customer tries to access other user', async () => {
            req.params.id = '123';
            req.user = { userType: 'customer', _id: { equals: () => false } };

            const mockUser = { _id: '123', email: 'user@test.com' };

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFindById = UserModelImport.findById;

            UserModelImport.findById = function () {
                return {
                    select: async function () {
                        return mockUser;
                    }
                };
            };

            await getOneUser(req, res);

            expect(res.statusCode).toBe(403);

            UserModelImport.findById = originalFindById;
        });
    });

    describe('deleteUser', () => {
        it('should soft delete user', async () => {
            req.params.id = '123';

            const mockUser = {
                _id: '123',
                softDelete: async function () {
                    return this;
                }
            };

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFindById = UserModelImport.findById;

            UserModelImport.findById = async function () {
                return mockUser;
            };

            await deleteUser(req, res);

            expect(res.statusCode).toBe(200);

            UserModelImport.findById = originalFindById;
        });

        it('should return 404 when user not found', async () => {
            req.params.id = '123';

            const UserModelImport = (await import('../../src/models/UserModel.js')).default;
            const originalFindById = UserModelImport.findById;

            UserModelImport.findById = async function () {
                return null;
            };

            await deleteUser(req, res);

            expect(res.statusCode).toBe(404);

            UserModelImport.findById = originalFindById;
        });
    });
});