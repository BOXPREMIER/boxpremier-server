import UserModel from "../models/UserModel.js";
import { tokenSign } from "../utils/handleJWT.js";
import { handleBadRequest, handleCreated, handleError, handleSuccess, handleUnauthorized } from "../utils/handleResponse.js";
import bcrypt from 'bcrypt';

export const registerController = async (req, res) => {
    try {

        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            street,
            number,
            floor,
            postalCode,
            city,
            province,
            country
        } = req.body;

        const emailExists = await UserModel.findOne({ email });

        if (emailExists) {
            return handleBadRequest(res, 'Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await UserModel.create({
            userType: 'customer',
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            street,
            number,
            floor,
            postalCode,
            city,
            province,
            country
        });

        const token = tokenSign({ id: newUser._id, userType: newUser.userType });
        const safeUser = await UserModel.findById(newUser._id).select('-password');

        return handleCreated(res, { user: safeUser, token }, 'User created successfully');
    } catch (error) {
        return handleError(res, error);
    }
}

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return handleBadRequest(res, 'Email and password are required');
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return handleUnauthorized(res, 'Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return handleUnauthorized(res, 'Invalid credentials');
        }

        const token = tokenSign({ id: user._id, userType: user.userType });
        const safeUser = await UserModel.findById(user._id).select('-password');

        return handleSuccess(res, { user: safeUser, token }, 'Login successful');
    } catch (error) {
        handleError(res, error);
    }
}