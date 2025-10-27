import UserModel from "../models/UserModel.js";
import { tokenSign } from "../utils/handleJWT.js";
import { handleBadResquest, handleCreated, handleError } from "../utils/handleResponse.js";
import bcrypt from 'bcrypt';

export const registerController = async (req, res) => {
    try {

        const userData = req.body;
        const emailExists = await UserModel.findOne({ email: userData.email });

        if (emailExists) {
            return handleBadResquest(res, 'Email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        const newUser = await UserModel.create(userData);

        const token = tokenSign({ id: newUser._id, userType: newUser.userType });
        const safeUser = await UserModel.findById(newUser._id).select('-password');

        return handleCreated(res, { user: safeUser, token }, 'User created successfully');
    } catch (error) {
        return handleError(res, error);
    }
}