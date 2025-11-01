import express from 'express';
import { registerController, loginController } from '../controllers/AuthController.js';
import { loginValidator, registerValidator } from '../validators/AuthValidator.js';

const AuthRouter = express.Router();

AuthRouter.post('/register', registerValidator, registerController);
AuthRouter.post('/login', loginValidator, loginController);

export default AuthRouter;