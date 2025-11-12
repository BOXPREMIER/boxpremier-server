import mongoose from "mongoose";

const { Schema, model } = mongoose;


const SubscriptionPlanSchema = new Schema(
    
    {
     boxType: {
        type: String,
        // enum: ["basic", "premium"], 
        required: true  
     },
     boxSize: {
        type: Number, 
        required: true
     },
     price: {
        type: Number, 
        required: true
     },
     active:{
        type: Boolean,
        required: true
     },

        //soft-delete field
    deleteAt: { type: Date, default: null }
    
    }, 
    {
        timestamps: true, 
    });

SubscriptionPlanSchema.pre(/^find/, function (next) {
    this.where({ deleteAt: null });
    next();
});

//method to soft-delete
SubscriptionPlanSchema.methods.softDelete = function () {
    this.deleteAt = new Date();
    return this.save();
}

export default model("SubscriptionPlan", SubscriptionPlanSchema);