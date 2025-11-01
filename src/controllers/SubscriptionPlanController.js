import SubscriptionPlanModel from '../models/SubscriptionPlanModel.js';
import { handleError, handleSuccess, handleNotFound, handleBadRequest, handleCreated, handleNoContent, handleForbidden } from '../utils/handleResponse.js';

export const createPlan = async (req, res) => {
    try {
        const isAdmin = req.user.userType === 'admin';

        if (!isAdmin) {
            return handleForbidden(res, 'Only admins can create plans');
        }

        const { boxType, boxSize, price, active } = req.body;

        const existingPlan = await SubscriptionPlanModel.findOne({
            boxType,
            boxSize
        });

        if (existingPlan) {
            return handleBadRequest(res, 'Plan with this box type and size already exists');
        }

        const plan = await SubscriptionPlanModel.create({
            boxType,
            boxSize,
            price,
            active
        });

        return handleCreated(res, plan, 'Plan created successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getAllPlans = async (req, res) => {
    try {
        const isAdmin = req.user.userType === 'admin';

        const filter = isAdmin ? {} : { active: true };

        const plans = await SubscriptionPlanModel.find(filter).sort({ boxType: 1, boxSize: 1 });

        return handleSuccess(res, plans, 'Plans retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await SubscriptionPlanModel.findById(id);

        if (!plan) {
            return handleNotFound(res, 'Plan not found');
        }

        return handleSuccess(res, plan, 'Plan retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updatePlan = async (req, res) => {
    try {
        const isAdmin = req.user.userType === 'admin';

        if (!isAdmin) {
            return handleForbidden(res, 'Only admins can update plans');
        }

        const { id } = req.params;
        const { boxType, boxSize, price, active } = req.body;

        const plan = await SubscriptionPlanModel.findById(id);

        if (!plan) {
            return handleNotFound(res, 'Plan not found');
        }

        if (boxType) plan.boxType = boxType;
        if (boxSize) plan.boxSize = boxSize;
        if (price !== undefined) plan.price = price;
        if (active !== undefined) plan.active = active;

        await plan.save();

        return handleSuccess(res, plan, 'Plan updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const deletePlan = async (req, res) => {
    try {
        const isAdmin = req.user.userType === 'admin';

        if (!isAdmin) {
            return handleForbidden(res, 'Only admins can delete plans');
        }

        const { id } = req.params;

        const plan = await SubscriptionPlanModel.findById(id);

        if (!plan) {
            return handleNotFound(res, 'Plan not found');
        }

        await plan.softDelete();

        return handleNoContent(res, 'Plan deleted successfully');
    } catch (error) {
        return handleError(res, error);
    }
};