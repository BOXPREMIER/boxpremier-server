import { tokenVerify } from '../utils/handleJWT.js';
import UserModel from '../models/UserModel.js';
import { handleUnauthorized, handleForbidden, handleError } from '../utils/handleResponse.js';

export const authenticate = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return handleUnauthorized(res, 'NEED_SESSION');
        }

        const token = req.headers.authorization.split(' ').pop();
        const dataToken = tokenVerify(token);

        if (!dataToken) {
            return handleUnauthorized(res, 'INVALID_TOKEN');
        }

        const user = await UserModel.findById(dataToken.id).select('-password');

        if (!user) {
            return handleUnauthorized(res, 'USER_NOT_FOUND');
        }

        req.user = user;
        next();
    } catch (error) {
        return handleUnauthorized(res, 'NOT_SESSION');
    }
};

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return handleForbidden(res, 'NOT_PERMISSION');
            }

            const userType = user.userType;
            const hasPermission = allowedRoles.includes(userType);

            if (!hasPermission) {
                return handleForbidden(res, 'NOT_PERMISSIONS');
            }

            next();
        } catch (error) {
            handleError(res, error);
        }
    };
}