import UserModel from '../models/UserModel.js';
import { handleBadRequest, handleError, handleNoContent, handleNotFound, handleSuccess, handleForbidden, handleCreated } from '../utils/handleResponse.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password -email');

        return handleSuccess(res, users);
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

        if (req.user.userType === 'customer' && !req.user._id.equals(id)) {
            return handleForbidden(res, 'You can only view your own profile');
        }

        return handleSuccess(res, user);
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
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, firstName, lastName, phone, street, number, floor, postalCode, city, province, country } = req.body;
        const user = await UserModel.findById(id);

        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        if (email && email !== user.email) {
            const emailExists = await UserModel.findOne({ email });
            if (emailExists) {
                return handleBadRequest(res, 'Email already exists');
            }
        }

        if (req.user.userType === 'customer' && !req.user._id.equals(id)) {
            return handleForbidden(res, 'You can only update your own profile');
        }

        const updateData = {};
        if (firstName) { updateData.firstName = firstName; };
        if (lastName) { updateData.lastName = lastName; };
        if (email) { updateData.email = email; };
        if (phone) { updateData.phone = phone; };
        if (street) { updateData.street = street; };
        if (number) { updateData.number = number; };
        if (floor !== undefined) { updateData.floor = floor; };
        if (postalCode) { updateData.postalCode = postalCode; };
        if (city) { updateData.city = city; };
        if (province) { updateData.province = province; };
        if (country) { updateData.country = country; };
        if (password) { updateData.password = await bcrypt.hash(password, 10); }

        const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select('firstName lastName');

        return handleSuccess(res, updatedUser, 'User updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updatePaymentMethod = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, lastFourDigits, cardHolderName, expirationDate, paymentToken } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        user.paymentMethod = {
            type,
            lastFourDigits,
            cardHolderName,
            expirationDate,
            paymentToken
        };

        await user.save();

        const safeUser = await UserModel.findById(userId).select('-password');
        return handleSuccess(res, safeUser, 'Payment method updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateUserPaymentMethodAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, lastFourDigits, cardHolderName, expirationDate, paymentToken } = req.body;

        const user = await UserModel.findById(id);
        if (!user) {
            return handleNotFound(res, 'User not found');
        }

        user.paymentMethod = { type, lastFourDigits, cardHolderName, expirationDate, paymentToken };

        await user.save();

        const safeUser = await UserModel.findById(id).select('-password');
        return handleSuccess(res, safeUser, 'Payment method updated successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const createUser = async (req, res) => {
    try {
        const {
            userType,
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

        const userData = {
            userType: userType || 'customer',
            firstName,
            lastName,
            email,
            password: hashedPassword
        };

        if (userType === 'customer') {
            userData.phone = phone;
            userData.street = street;
            userData.number = number;
            userData.floor = floor;
            userData.postalCode = postalCode;
            userData.city = city;
            userData.province = province;
            userData.country = country;
        }

        const newUser = await UserModel.create(userData);
        const safeUser = await UserModel.findById(newUser._id).select('-password');

        return handleCreated(res, safeUser, 'User created successfully');
    } catch (error) {
        return handleError(res, error);
    }
};