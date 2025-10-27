import OrderModel from '../models/OrderModel.js';
import UserModel from '../models/UserModel.js';
import SubscriptionModel from '../models/SuscriptionModel.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

import { handleCreated, handleError, handleForbidden, handleNoContent, handleNotFound, handleSuccess } from '../utils/handleResponse.js';

export const getAllOrders = async (req, res) => {
    try {
        let orders;

        //admin user see all orders
        if (req.user.userType === "admin") {
            orders = await OrderModel.find().populate('userId', 'firstName lastName email').populate('subscriptionId').sort({ orderDate: -1 });

            // customer user see only their orders
        } else {
            orders = (await OrderModel.find({ userId: req.user._id }).populate('subscriptionId')).toSorted({ orderDate: -1 });
        }

        return handleSuccess(res, orders);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id).populate('userId', 'firstName lastName email').populate('subscriptionId');

        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        if (req.user.userType !== 'admin' && !order.userId._id.equals(req.user._id)) {
            return handleForbidden(res, "Access denied: You can't view other orders");
        }

        return handleSuccess(res, order);
    } catch (error) {
        return handleError(res, error);
    }
};

//only for dev envrioment
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findByIdAndDelete(id);

        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        return handleNoContent(res, 'Order deleted successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const createOrder = async (req, res) => {
    try {
        const { userId, subscriptionId } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        const subscription = await SubscriptionModel.findById(subscriptionId);
        if (!subscription) {
            return handleNotFound(res, 'Subscription not found');
        }

        const subsPlan = await SubscriptionPlan.findById(subscription.subscriptionPlan);
        if (!subsPlan) {
            return handleNotFound(res, 'Plan not found');
        }

        const order = await OrderModel.create({
            userId: user._id,
            subscriptionId: subscription._id,

            boxType: subscription.boxType,
            boxSize: subscription.boxSize,
            wineType: subscription.wineType,

            fullName: `${user.firstName} ${user.lastName}`,
            phone: user.phone,
            street: user.street,
            number: user.number,
            floor: user.floor,
            postalCode: user.postalCode,
            city: user.city,
            province: user.province,
            country: user.country,

            orderDate: new Date(),
            totalAmount: subsPlan.price,
            status: 'pending'
        });

        return handleCreated(res, order, 'Order created');
    } catch (error) {
        return handleError(res, error);
    }
};