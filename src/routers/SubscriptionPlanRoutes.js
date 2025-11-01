import express from 'express';
import { createPlan, getAllPlans, getPlanById, updatePlan, deletePlan } from '../controllers/SubscriptionPlanController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';
import { createPlanValidator, updatePlanValidator } from '../validators/PlanValidator.js';

const PlanRouter = express.Router();

PlanRouter.use(authenticate);

PlanRouter.get('/', getAllPlans);
PlanRouter.get('/:id', getPlanById);
PlanRouter.post('/', checkRole(['admin']), createPlanValidator, createPlan);
PlanRouter.put('/:id', checkRole(['admin']), updatePlanValidator, updatePlan);
PlanRouter.delete('/:id', checkRole(['admin']), deletePlan);

export default PlanRouter;