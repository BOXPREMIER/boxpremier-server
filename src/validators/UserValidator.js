import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/handleValidation.js';

export const updateUserValidator = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Must be a valid email'),

    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('phone')
        .optional()
        .trim()
        .notEmpty().withMessage('Phone cannot be empty'),

    body('street')
        .optional()
        .trim()
        .notEmpty().withMessage('Street cannot be empty'),

    body('number')
        .optional()
        .trim()
        .notEmpty().withMessage('Number cannot be empty'),

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

export const createUserValidator = [
    body('userType')
        .trim()
        .notEmpty().withMessage('User type is required')
        .isIn(['admin', 'customer']).withMessage('Invalid user type'),

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
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Phone is required for customers'),

    body('street')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Street is required for customers'),

    body('number')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Number is required for customers'),

    body('postalCode')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Postal code is required for customers'),

    body('city')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('City is required for customers'),

    body('province')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Province is required for customers'),

    body('country')
        .if(body('userType').equals('customer'))
        .trim()
        .notEmpty().withMessage('Country is required for customers'),

    handleValidationErrors
];