import dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;
const fileEnv = NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: fileEnv });

export const HOST = process.env.HOST;
export const PORT = process.env.PORT;

export const MONGO_URI = process.env.MONGO_URI;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES = process.env.JWT_EXPIRES;