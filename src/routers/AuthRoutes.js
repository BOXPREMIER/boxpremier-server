import express from 'express';
import { registerController, loginController } from '../controllers/AuthController.js';

const AuthRouter = express.Router();

AuthRouter.post('/register', registerController);
AuthRouter.post('/login', loginController);

export default AuthRouter;