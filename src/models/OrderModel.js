import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },

    //copied from user at order creation
    boxType: { type: String, required: true },
    wineType: { type: String, enum: ['mixed', 'rose', 'red', 'sparkling'], required: true },
    boxSize: { type: Number, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    number: { type: String, required: true },
    floor: String,
    postalCode: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    country: { type: String, required: true },

    // delivered
    status: {
        type: String,
        enum: ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        required: true
    },
    trackingNumber: String,
    carrier: String,

    orderDate: { type: Date, required: true, default: Date.now },
    shippedDate: Date,
    deliveredDate: Date,

    totalAmount: { type: Number, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

const OrderModel = mongoose.model('Order', orderSchema);

export default OrderModel;