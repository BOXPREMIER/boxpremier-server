import mongoose from 'mongoose';

const isUserType = function () {
    return this.userType === 'user';
};

const userSchema = new mongoose.Schema({

    userType: { type: String, enum: ['admin', 'user'], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    phone: { type: String, required: isUserType },
    street: { type: String, required: isUserType },
    number: { type: String, required: isUserType },
    floor: String,
    postalCode: { type: String, required: isUserType },
    city: { type: String, required: isUserType },
    province: { type: String, required: isUserType },
    country: { type: String, required: isUserType },

    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
},
    {
        timestamps: true
    });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;