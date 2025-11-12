import PaymentModel from '../models/PaymentModel.js';
import SubscriptionModel from '../models/SubscriptionModel.js';
import OrderModel from '../models/OrderModel.js';
import { handleError, handleSuccess, handleNotFound, handleCreated, handleForbidden } from '../utils/handleResponse.js';

export const createPayment = async (req, res) => {
    try {
        const { subscriptionId, amount, gateway } = req.body;

        const subscription = await SubscriptionModel.findById(subscriptionId);
        if (!subscription) {
            return handleNotFound(res, 'Subscription not found');
        }

        const isAdmin = req.user.userType === 'admin';
        if (!isAdmin && !subscription.user.equals(req.user._id)) {
            return handleForbidden(res, 'You can only create payments for your own subscriptions');
        }

        const payment = await PaymentModel.create({
            subscriptionId,
            amount,
            gateway,
            status: 'pending',
            paymentType: subscription.isGift ? 'one-time' : 'recurring',
            monthsPaid: subscription.isGift ? subscription.giftDurationMonths : 1
        });

        return handleCreated(res, payment, 'Payment created successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const isAdmin = req.user.userType === 'admin';
        let payments;

        if (isAdmin) {
            payments = await PaymentModel.find()
                .populate({
                    path: 'subscriptionId',
                    populate: { path: 'user', select: 'firstName lastName email' }
                })
                .populate('orderId')
                .sort({ createdAt: -1 });
        } else {
            const userSubscriptions = await SubscriptionModel.find({ user: req.user._id });
            const subscriptionIds = userSubscriptions.map(sub => sub._id);

            payments = await PaymentModel.find({ subscriptionId: { $in: subscriptionIds } })
                .populate('subscriptionId')
                .populate('orderId')
                .sort({ createdAt: -1 });
        }

        return handleSuccess(res, payments, 'Payments retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await PaymentModel.findById(id)
            .populate({
                path: 'subscriptionId',
                populate: { path: 'user', select: 'firstName lastName email' }
            })
            .populate('orderId');

        if (!payment) {
            return handleNotFound(res, 'Payment not found');
        }

        const isAdmin = req.user.userType === 'admin';
        if (!isAdmin && !payment.subscriptionId.user._id.equals(req.user._id)) {
            return handleForbidden(res, 'You can only view your own payments');
        }

        return handleSuccess(res, payment, 'Payment retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, transactionId } = req.body;

        const payment = await PaymentModel.findById(id);
        if (!payment) { return handleNotFound(res, 'Payment not found'); }

        if (status) { payment.status = status; }
        if (transactionId) { payment.transactionId = transactionId; }

        if (status === 'completed' && !payment.paymentDate) { payment.paymentDate = new Date(); }

        await payment.save();

        return handleSuccess(res, payment, 'Payment updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};