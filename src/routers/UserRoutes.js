import express from 'express';
import { getAllUsers, getOneUser, updateUser, deleteUser } from '../controllers/UserController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';

const UserRouter = express.Router();

UserRouter.get('/', authenticate, checkRole(['admin']), getAllUsers);
UserRouter.get('/:id', authenticate, checkRole(['admin', 'customer']), getOneUser);
UserRouter.put('/:id', authenticate, checkRole(['admin', 'customer']), updateUser);
UserRouter.delete('/:id', authenticate, checkRole(['admin']), deleteUser);

export default UserRouter;