import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/handleValidation.js';

export const createSubscriptionValidator = [
    body('subscriptionPlanId')
        .trim()
        .notEmpty().withMessage('Subscription plan ID is required')
        .isMongoId().withMessage('Invalid subscription plan ID'),

    body('wineType')
        .trim()
        .notEmpty().withMessage('Wine type is required')
        .isIn(['mixed', 'rose', 'red', 'sparkling']).withMessage('Invalid wine type'),

    body('userId')
        .optional()
        .isMongoId().withMessage('Invalid user ID'),

    handleValidationErrors
];

export const updateSubscriptionValidator = [
    body('wineType')
        .optional()
        .trim()
        .isIn(['mixed', 'rose', 'red', 'sparkling']).withMessage('Invalid wine type'),

    body('status')
        .optional()
        .isIn(['active', 'paused', 'canceled', 'expired', 'pending']).withMessage('Invalid status'),

    handleValidationErrors
];