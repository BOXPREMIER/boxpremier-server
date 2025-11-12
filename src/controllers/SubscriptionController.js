import SubscriptionModel from '../models/SubscriptionModel.js';
import SubscriptionPlanModel from '../models/SubscriptionPlanModel.js';
import UserModel from '../models/UserModel.js';
import { handleError, handleSuccess, handleNotFound, handleBadRequest, handleCreated, handleForbidden } from '../utils/handleResponse.js';

export const createSubscription = async (req, res) => {
  try {
    const { subscriptionPlanId, wineType, userId, isGift, giftInfo } = req.body;
    const isAdmin = req.user.userType === 'admin';

    const targetUserId = isAdmin && userId ? userId : req.user._id;

    const plan = await SubscriptionPlanModel.findById(subscriptionPlanId);
    if (!plan) {
      return handleNotFound(res, 'Subscription plan not found');
    }

    const purchaser = await UserModel.findById(targetUserId);
    if (!purchaser) {
      return handleNotFound(res, 'User not found');
    }

    if (!purchaser.paymentMethod || !purchaser.paymentMethod.type) {
      return handleBadRequest(res, 'Payment method required');
    }

    let recipientUserId = targetUserId;

    if (isGift && giftInfo) {
      if (!giftInfo.recipientEmail || !giftInfo.recipientName || !giftInfo.recipientPhone) {
        return handleBadRequest(res, 'Recipient data required for gift subscription');
      }

      if (!giftInfo.recipientAddress || !giftInfo.recipientAddress.street || !giftInfo.recipientAddress.number) {
        return handleBadRequest(res, 'Recipient address required for gift subscription');
      }

      let recipient = await UserModel.findOne({ email: giftInfo.recipientEmail });

      if (!recipient) {
        const [firstName, ...lastNameParts] = giftInfo.recipientName.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

        recipient = await UserModel.create({
          userType: 'customer',
          firstName,
          lastName,
          email: giftInfo.recipientEmail,
          phone: giftInfo.recipientPhone,
          password: Math.random().toString(36).slice(-12),
          street: giftInfo.recipientAddress.street,
          number: giftInfo.recipientAddress.number,
          floor: giftInfo.recipientAddress.floor || '',
          postalCode: giftInfo.recipientAddress.postalCode,
          city: giftInfo.recipientAddress.city,
          province: giftInfo.recipientAddress.province,
          country: giftInfo.recipientAddress.country || 'ES'
        });
      }

      recipientUserId = recipient._id;
    }

    const nextPayDate = new Date();
    nextPayDate.setDate(nextPayDate.getDate() + 30);

    const subscriptionData = {
      user: recipientUserId,
      subscriptionPlan: subscriptionPlanId,
      wineType,
      boxType: plan.boxType,
      boxSize: plan.boxSize,
      startDate: new Date(),
      nextPayDate: nextPayDate,
      status: 'pending',
      isGift: isGift || false,
      payMethod: purchaser.paymentMethod.type,
      createdBy: req.user._id
    };

    if (isGift && giftInfo) {
      const durationMonths = giftInfo.giftDurationMonths || 1;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      subscriptionData.giftFromId = targetUserId;
      subscriptionData.giftMessage = giftInfo.giftMessage || '';
      subscriptionData.giftDurationMonths = durationMonths;
      subscriptionData.giftActivatedAt = startDate;
      subscriptionData.endDate = endDate;
    }

    const subscription = await SubscriptionModel.create(subscriptionData);

    return handleCreated(res, subscription, 'Subscription created successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const isAdmin = req.user.userType === 'admin';
    const userId = req.params.userId || req.user._id;

    if (!isAdmin && userId.toString() !== req.user._id.toString()) {
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

