import session, { MemoryStore } from "express-session";
import { User } from "./types";
import mongoDbSession from "connect-mongodb-session";
import dotenv from "dotenv";

dotenv.config();

const MongoDBStore = mongoDbSession(session);

const mongoStore = new MongoDBStore({
    uri: process.env.MONGO_URI || "",
    databaseName: "LoginSystem",
    collection: "Sessions",
});

declare module 'express-session' {
    export interface SessionData {
        user?: User
    }
}

export default session({
    secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
    store: mongoStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
});