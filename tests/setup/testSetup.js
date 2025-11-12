import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export async function setupTestDB() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Tests can only run in test environment!');
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}

export async function teardownTestDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}

export async function clearTestDB() {
    const dbName = mongoose.connection.name;
    if (!dbName.includes('test') && !dbName.includes('memory')) {
        throw new Error(`Refusing to clear production database: ${dbName}`);
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}