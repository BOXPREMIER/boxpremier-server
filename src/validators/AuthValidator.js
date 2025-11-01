import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/handleValidation.js';

export const registerValidator = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone is required'),

    body('street')
        .trim()
        .notEmpty().withMessage('Street is required'),

    body('number')
        .trim()
        .notEmpty().withMessage('Number is required'),

    body('postalCode')
        .trim()
        .notEmpty().withMessage('Postal code is required'),

    body('city')
        .trim()
        .notEmpty().withMessage('City is required'),

    body('province')
        .trim()
        .notEmpty().withMessage('Province is required'),

    body('country')
        .trim()
        .notEmpty().withMessage('Country is required'),

    handleValidationErrors
];

export const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];