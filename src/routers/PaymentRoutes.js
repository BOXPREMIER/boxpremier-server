import express from 'express';
import { createPayment, getAllPayments, getPaymentById, updatePaymentStatus } from '../controllers/PaymentController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';

const PaymentRouter = express.Router();

PaymentRouter.use(authenticate);

PaymentRouter.get('/', getAllPayments);
PaymentRouter.get('/:id', getPaymentById);
PaymentRouter.post('/', createPayment);
PaymentRouter.patch('/:id/status', checkRole(['admin']), updatePaymentStatus);

export default PaymentRouter;