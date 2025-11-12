import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/handleValidation.js';

export const createPlanValidator = [
    body('boxType')
        .trim()
        .notEmpty().withMessage('Box type is required'),
       // .isIn(['basic', 'premium']).withMessage('Invalid box type'),

    body('boxSize')
        .notEmpty().withMessage('Box size is required')
        .isInt({ min: 1 }).withMessage('Box size must be at least 1'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('active')
        .notEmpty().withMessage('Active status is required')
        .isBoolean().withMessage('Active must be true or false'),

    handleValidationErrors
];

export const updatePlanValidator = [
    body('boxType')
        .optional()
        .trim(),
        //.isIn(['basic', 'premium']).withMessage('Invalid box type'),

    body('boxSize')
        .optional()
        .isInt({ min: 1 }).withMessage('Box size must be at least 1'),

    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('active')
        .optional()
        .isBoolean().withMessage('Active must be true or false'),

    handleValidationErrors
];