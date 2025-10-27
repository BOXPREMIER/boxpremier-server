import OrderModel from '../models/OrderModel.js';
import { handleError, handleSuccess } from '../utils/handleResponse.js';

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
}