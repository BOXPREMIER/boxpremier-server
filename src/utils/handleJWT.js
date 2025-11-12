import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES } from '../config/config.js';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in .env file');
}

export const tokenSign = (payload) => {
    try {
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return token;
    } catch (error) {
        console.error("Error in tokenSign: ", error);
        return null;
    }
};

export const tokenVerify = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        return decoded;
    } catch (error) {
        console.log("Error in tokenVerify: ", error);
        return null;
    }
};