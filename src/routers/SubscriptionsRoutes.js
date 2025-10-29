import express from 'express';
import { createSubscription, listSubscriptions } from '../controllers/SubscriptionController.js';

const SubsRouter = express.Router();

//SubsRouter.post('/newsubsriber', createSubscription);
SubsRouter.get('/', listSubscriptions);

export default SubsRouter;