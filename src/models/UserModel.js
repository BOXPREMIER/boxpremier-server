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

    preferences: {
        emailNotifications: { type: Boolean, default: true }
    },
    paymentMethod: {
        type: { type: String, enum: ['card', 'paypal', 'multisafepay'] },
        lastFourDigits: String,
        cardHolderName: String,
        expirationDate: String,
        paymentToken: String
    },

    status: { type: Boolean, default: true },

    //soft-delete field
    deleteAt: { type: Date, default: null }
},
    {
        timestamps: true
    });

//middleware for exclude soft-deleted users in queries... 
userSchema.pre(/^find/, function (next) {
    this.where({ deleteAt: null });
    next();
});

//method to soft-delete
userSchema.methods.softDelete = function () {
    this.deleteAt = new Date();
    return this.save();
}

const UserModel = mongoose.model('User', userSchema);

export default UserModel;