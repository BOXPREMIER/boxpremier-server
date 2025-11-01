import { validationResult } from 'express-validator';
import { handleBadRequest } from './handleResponse.js';

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path,
            message: error.msg
        }));

        return handleBadRequest(res, formattedErrors);
    }

    next();
};