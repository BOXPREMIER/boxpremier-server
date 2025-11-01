import SubscriptionModel from '../models/SubscriptionModel.js';
import SubscriptionPlanModel from '../models/SubscriptionPlanModel.js';
import UserModel from '../models/UserModel.js';
import { handleError, handleSuccess, handleNotFound, handleBadRequest, handleCreated, handleForbidden } from '../utils/handleResponse.js';

export const createSubscription = async (req, res) => { 
  try {
    const { subscriptionPlanId, wineType, userId } = req.body;
    const isAdmin = req.user.userType === 'admin';

    const targetUserId = isAdmin && userId ? userId : req.user._id;

    const plan = await SubscriptionPlanModel.findById(subscriptionPlanId);
    if (!plan) {
      return handleNotFound(res, 'Subscription plan not found');
    }

    const user = await UserModel.findById(targetUserId);
    if (!user) {
      return handleNotFound(res, 'User not found');
    }

    if (!user.paymentMethod || !user.paymentMethod.type) {
      return handleBadRequest(res, 'Payment method required');
    }

    const nextPayDate = new Date();
    nextPayDate.setDate(nextPayDate.getDate() + 30);

    const subscription = await SubscriptionModel.create({
      user: targetUserId,
      subscriptionPlan: subscriptionPlanId,
      wineType,
      boxType: plan.boxType,
      boxSize: plan.boxSize,
      startDate: new Date(),
      nextPayDate: nextPayDate,
      status: 'pending',
      isGift: false,
      payMethod: user.paymentMethod.type,
      createdBy: req.user._id
    });

    return handleCreated(res, subscription, 'Subscription created successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const isAdmin = req.user.userType === 'admin';
    const userId = req.params.userId || req.user._id;

    if (!isAdmin && userId !== req.user._id.toString()) {
      return handleForbidden(res, 'You can only view your own subscriptions');
    }

    const filter = isAdmin && !req.params.userId ? {} : { user: userId };

    const subscriptions = await SubscriptionModel.find(filter)
      .populate('subscriptionPlan')
      .populate('user', 'firstName lastName email')
      .populate('giftFromId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return handleSuccess(res, subscriptions, 'Subscriptions retrieved successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.userType === 'admin';

    let subscription;

    if (isAdmin) {
      subscription = await SubscriptionModel.findById(id);
    } else {
      subscription = await SubscriptionModel.findOne({
        _id: id,
        user: req.user._id
      });
    }

    if (!subscription) {
      return handleNotFound(res, 'Subscription not found');
    }

    if (subscription.status === 'canceled') {
      return handleBadRequest(res, 'Subscription already canceled');
    }

    subscription.status = 'canceled';
    if (req.user) {
      subscription.updatedBy = req.user._id;
    }
    await subscription.save();

    return handleSuccess(res, subscription, 'Subscription canceled successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { wineType, status } = req.body;
    const isAdmin = req.user.userType === 'admin';

    let subscription;

    if (isAdmin) {
      subscription = await SubscriptionModel.findById(id);
    } else {
      subscription = await SubscriptionModel.findOne({
        _id: id,
        user: req.user._id
      });
    }

    if (!subscription) {
      return handleNotFound(res, 'Subscription not found');
    }

    if (wineType) subscription.wineType = wineType;
    if (status && isAdmin) subscription.status = status;
    if (req.user) {
      subscription.updatedBy = req.user._id;
    }
    await subscription.save();

    return handleSuccess(res, subscription, 'Subscription updated successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.userType === 'admin';

    const subscription = await SubscriptionModel.findById(id)
      .populate('subscriptionPlan')
      .populate('user', 'firstName lastName email')
      .populate('giftFromId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!subscription) {
      return handleNotFound(res, 'Subscription not found');
    }

    if (!isAdmin && !subscription.user._id.equals(req.user._id)) {
      return handleForbidden(res, 'You can only view your own subscription');
    }

    return handleSuccess(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

