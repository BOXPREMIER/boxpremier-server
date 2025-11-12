import express from 'express';
import { createSubscription, getUserSubscriptions, cancelSubscription, updateSubscription, getSubscriptionById } from '../controllers/SubscriptionController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';
import { createSubscriptionValidator, updateSubscriptionValidator } from '../validators/SubscriptionValidations.js';

const SubsRouter = express.Router();

SubsRouter.use(authenticate);

SubsRouter.post('/', createSubscriptionValidator, createSubscription);
SubsRouter.get('/', getUserSubscriptions);
SubsRouter.get('/details/:id', getSubscriptionById);
SubsRouter.get('/:userId', checkRole(['admin']), getUserSubscriptions);
SubsRouter.put('/:id', updateSubscriptionValidator, updateSubscription);
SubsRouter.delete('/:id', cancelSubscription);

export default SubsRouter;