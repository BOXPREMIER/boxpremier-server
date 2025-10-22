import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.js";

export async function db_connection() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.log("MongoDB connection error: ", error);
    }
}

export async function db_close_connection() {
    try {
        await mongoose.connection.close();
        console.log("MongoDB connected closed successfully!");
    } catch (error) {
        console.log("MongoDB connection closed error: ", error);
    }
}