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
            orders = (await OrderModel.find({ userId: req.user._id }).populate('subscriptionId')).sort({ orderDate: -1 });
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

//updates functions

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return handleError(res, { message: `Invalid status. Valid options ${validStatuses.join(', ')}` });
        }

        const order = await OrderModel.findById(id);
        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        // block status change if delivered
        if (order.status === "delivered") {
            return handleForbidden(res, 'Cannot change status of delivered order');
        }

        if (status === 'shipped' && (!order.trackingNumber || !order.carrier)) {
            return handleError(res, { message: 'Cannot set status to shipped without tracking number and carrier' });
        }

        if (status === 'shipped') {
            order.shippedDate = new Date();
        }
        if (status === 'delivered') {
            order.deliveredDate = new Date();
        }

        order.status = status;
        await order.save();

        return handleSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateOrderAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { street, number, floor, postalCode, city, province, country } = req.body;

        const order = await OrderModel.findById(id);
        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        if (order.status === "delivered") {
            return handleForbidden(res, 'Cannot change address of delivered order');
        }

        if (street) { order.street = street };
        if (number) { order.number = number };
        if (floor !== undefined) { order.floor = floor };
        if (postalCode) { order.postalCode = postalCode };
        if (city) { order.city = city };
        if (province) { order.province = province };
        if (country) { order.country = country };

        await order.save();

        return handleSuccess(res, order, 'Order addres updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateOrderTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const { trackingNumber, carrier } = req.body;

        const order = await OrderModel.findById(id);
        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        if (trackingNumber !== undefined) {
            order.trackingNumber = trackingNumber;
        }

        if (carrier !== undefined) {
            order.carrier = carrier;
        }

        await order.save();
        return handleSuccess(res, order, 'Order tracking updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id);
        if (!order) {
            return handleNotFound(res, 'Order not found');
        }

        if (!['pending', 'preparing'].includes(order.status)) {
            return handleForbidden(res, "Cannot cancel order with status: 'shipped', 'delivered'");
        }

        order.status = 'cancelled';
        await order.save();

        return handleSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
        return handleError(res, error);
    }
};