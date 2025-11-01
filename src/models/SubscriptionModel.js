import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

function isGiftRequired() {
  return this.isGift === true;
}

const SubscriptionSchema = new Schema(
  {

    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subscriptionPlan: {
      type: Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },

    wineType: { type: String, enum: ["mixed", "rose", "red", "sparkling"], trim: true },
    boxType: { type: String, enum: ["basic", "premium"], trim: true },
    boxSize: { type: Number, min: 1 },

    // Dates
    startDate: { type: Date },
    nextPayDate: { type: Date },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "paused", "canceled", "expired", "pending"],
      default: "pending",
      index: true,
    },
    // Gift
    isGift: { type: Boolean, default: false },
    giftFromId: {
      type: Types.ObjectId, ref: "User", required: isGiftRequired,
    },
    giftMessage: { type: String, trim: true, maxlength: 500 },
    giftDurationMonths: {
      type: Number,
      enum: [1, 3, 6, 12],
      default: 1,
      required: function () { return this.isGift === true; }
    },
    giftActivatedAt: { type: Date, default: null },
    // endDate: { type: Date, default: null },  ← REMOVE ESSA LINHA
    // Payment
    payMethod: { type: String, required: true },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      index: true
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
      index: true
    }
  },
  {
    // it adds createdAt y updatedAt
    timestamps: true,
  }
);

SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ startDate: -1 });

export default model("Subscription", SubscriptionSchema);
