import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/handleValidation.js';

export const updateOrderStatusValidator = [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'preparing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),

    handleValidationErrors
];

export const updateOrderAddressValidator = [
    body('street')
        .optional()
        .trim()
        .notEmpty().withMessage('Street cannot be empty'),

    body('number')
        .optional()
        .trim()
        .notEmpty().withMessage('Number cannot be empty'),

    body('phone')
        .optional()
        .trim()
        .notEmpty().withMessage('Phone cannot be empty'),

    body('postalCode')
        .optional()
        .trim()
        .notEmpty().withMessage('Postal code cannot be empty'),

    body('city')
        .optional()
        .trim()
        .notEmpty().withMessage('City cannot be empty'),

    body('province')
        .optional()
        .trim()
        .notEmpty().withMessage('Province cannot be empty'),

    body('country')
        .optional()
        .trim()
        .notEmpty().withMessage('Country cannot be empty'),

    handleValidationErrors
];

export const updateOrderTrackingValidator = [
    body('trackingNumber')
        .optional()
        .trim()
        .notEmpty().withMessage('Tracking number cannot be empty'),

    body('carrier')
        .optional()
        .trim()
        .notEmpty().withMessage('Carrier cannot be empty'),

    handleValidationErrors
];