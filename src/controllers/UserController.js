import UserModel from '../models/UserModel.js';
import { handleError, handleNoContent, handleNotFound, handleSucess } from '../utils/handleResponse.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password');

        return handleSucess(res, users);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getOneUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id).select('-password');

        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        return handleSucess(res, user);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id);

        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        await user.softDelete();

        return handleNoContent(res, 'User deleted successfully');
    } catch (error) {
        return handleError(res, error);
    }
}