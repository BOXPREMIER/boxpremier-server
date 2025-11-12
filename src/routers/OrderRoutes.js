import express from 'express';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';
import { cancelOrder, createOrder, deleteOrder, getAllOrders, getOrderById, updateOrderAddress, updateOrderStatus, updateOrderTracking } from '../controllers/OrderController.js';
import { updateOrderStatusValidator, updateOrderAddressValidator, updateOrderTrackingValidator } from '../validators/OrderValidator.js';

const OrderRouter = express.Router();
OrderRouter.use(authenticate);

OrderRouter.get('/', getAllOrders);
OrderRouter.get('/:id', getOrderById);

OrderRouter.post('/', checkRole(['admin']), createOrder);
OrderRouter.patch('/:id/status', checkRole(['admin']), updateOrderStatusValidator, updateOrderStatus);
OrderRouter.patch('/:id/address', checkRole(['admin']), updateOrderAddressValidator, updateOrderAddress);
OrderRouter.patch('/:id/tracking', checkRole(['admin']), updateOrderTrackingValidator, updateOrderTracking);
OrderRouter.patch('/:id/cancel', checkRole(['admin']), cancelOrder);

//only in dev
OrderRouter.delete('/:id', checkRole(['admin']), deleteOrder);

export default OrderRouter;