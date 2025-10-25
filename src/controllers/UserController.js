import UserModel from '../models/UserModel.js';
import { handleError } from '../utils/handleError.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password');

        res.status(200).json({ data: users });
    } catch (error) {
        return handleError(res, error);
    }
};
