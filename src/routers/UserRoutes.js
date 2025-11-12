import express from 'express';
import { createUser, getAllUsers, getOneUser, updateUser, deleteUser, updatePaymentMethod, updateUserPaymentMethodAdmin } from '../controllers/UserController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';
import { updateUserValidator, createUserValidator } from '../validators/UserValidator.js';

const UserRouter = express.Router();

UserRouter.post('/', authenticate, checkRole(['admin']), createUserValidator, createUser);
UserRouter.get('/', authenticate, checkRole(['admin']), getAllUsers);
UserRouter.get('/:id', authenticate, checkRole(['admin', 'customer']), getOneUser);
UserRouter.put('/:id', authenticate, checkRole(['admin', 'customer']), updateUserValidator, updateUser);
UserRouter.delete('/:id', authenticate, checkRole(['admin']), deleteUser);

UserRouter.patch('/me/payment-method', authenticate, updatePaymentMethod);
UserRouter.patch('/:id/payment-method', authenticate, checkRole(['admin']), updateUserPaymentMethodAdmin);

export default UserRouter;