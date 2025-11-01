import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', required: true },
    gateway: { type: String, enum: ['multisafepay', 'paypal', 'redsys'], required: true },
    transactionId: { type: String, default: null },
    paymentDate: { type: Date, default: null },
    paymentType: { type: String, enum: ['recurring', 'one-time'], required: true },
    monthsPaid: { type: Number, default: 1 }
}, {
    timestamps: true
});

const PaymentModel = mongoose.model('Payment', paymentSchema);

export default PaymentModel;