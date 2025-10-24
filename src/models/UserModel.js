import mongoose from 'mongoose';

const isCustomerType = function () {
    return this.userType === 'customer';
};

const userSchema = new mongoose.Schema({

    userType: { type: String, enum: ['admin', 'customer'], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    phone: { type: String, required: isCustomerType },
    street: { type: String, required: isCustomerType },
    number: { type: String, required: isCustomerType },
    floor: String,
    postalCode: { type: String, required: isCustomerType },
    city: { type: String, required: isCustomerType },
    province: { type: String, required: isCustomerType },
    country: { type: String, required: isCustomerType },

    status: { type: Boolean, default: true },
},
    {
        timestamps: true
    });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;