import { MongoClient, ObjectId } from "mongodb";
import session from "express-session";
import mongoDbSession from "connect-mongodb-session";
import bcrypt from "bcrypt";
import { User, Minifig, MinifigSet, Blacklist, MinifigParts, Part, Set, UnsortedMinifigsGameData, BlacklistGameData, SortedMinifigsGameData } from "./types";
import dotenv from "dotenv";

dotenv.config();


export const client: MongoClient = new MongoClient(process.env.MONGO_URI || "");
export const userCollection = client.db("LoginSystem").collection<User>("Users");
const saltRounds: number = 10;

// Session store
const MongoDBStore = mongoDbSession(session);

const mongoStore = new MongoDBStore({
    uri: process.env.MONGO_URI ?? "",
    databaseName: "LoginSystem",
    collection: "Sessions"
});

mongoStore.on("error", (error) => {
    console.error(error);
});

declare module 'express-session' {
    export interface SessionData {
        username?: string;
        cachedMinifigs?: Minifig[];
        cachedSets?: Set[];
        cachedMinifigParts?: MinifigParts[];
    }
}

export default session({
    secret: process.env.SESSION_SECRET ?? "",
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
});

// Async connect functions
export const connect = async () => {
    try {
        await client.connect();
        console.info("Connected to database");
        await createInitialUser();
        console.info("Created initial user");
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}

export const exit = async () => {
    try {
        await client.close();
        console.info("Connection closed");
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

async function createInitialUser(): Promise<void> {
    if (await userCollection.countDocuments() > 0) return;
    
    let firstName: string | undefined = process.env.ADMIN_FN;
    let lastName: string | undefined = process.env.ADMIN_LN;
    let email: string | undefined = process.env.ADMIN_EMAIL;
    let password: string | undefined = process.env.ADMIN_PASSWORD;

    if (firstName === undefined || lastName === undefined || email === undefined || password === undefined) {
        throw new Error("ADMIN_FN, ADMIN_LN, ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment");
    }

    await userCollection.insertOne({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: await bcrypt.hash(password, saltRounds),
        role: "ADMIN"
    });
}

export async function createNewUser(firstName: string, lastName: string, email: string, password: string): Promise<User> {
    if (firstName === undefined || lastName === undefined || email === undefined || password === undefined) {
        throw new Error("Some user values were not set properly. Please try again!");
    }

    await userCollection.insertOne({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: await bcrypt.hash(password, saltRounds),
        role: "USER"
    });

    return { firstName, lastName, email, password, role: "USER" }
}

export async function login(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email and password required");
    }

    let user : User | null = await userCollection.findOne<User>({ email: email });

    if (user) {
        if (await bcrypt.compare(password, user.password!)) return user;
        else throw new Error("Password incorrect");
    } else {
        throw new Error("User not found");
    }
}

// Async database query functions
export async function retrieveBlacklist(user: User) : Promise<Blacklist[]> {
    let response = await client.db("GameData").collection("Blacklist").findOne<BlacklistGameData>({ email: user.email });
    let blacklist: Blacklist[] = response?.blacklistedMinifigs ? response.blacklistedMinifigs : [];
    
    return new Promise<Blacklist[]>((resolve, reject) => {
        resolve(blacklist);
    });
}

export async function retrieveUnsortedMinifigs(user: User): Promise<Minifig[]> {
    let response = await client.db("GameData").collection("UnsortedMinifigs").findOne<UnsortedMinifigsGameData>({ email: user.email });
    console.log(response?.unsortedMinifigs.length);
    let unsortedMinifigs: Minifig[] = response?.unsortedMinifigs ? response.unsortedMinifigs : [];

    return new Promise<Minifig[]>((resolve, reject) => {
        resolve(unsortedMinifigs);
    });
}

export async function retrieveSortedMinifigs(user: User): Promise<MinifigSet[]> {
    let response = await client.db("GameData").collection("SortedMinifigs").findOne<SortedMinifigsGameData>({ email: user.email });
    let sortedMinifigs: MinifigSet[] = response?.sortedMinifigs ? response.sortedMinifigs : [];

    return new Promise<MinifigSet[]>((resolve, reject) => {
        resolve(sortedMinifigs);
    });
}

export async function addMinifigToSet(user: User, minifig: Minifig, set: Set): Promise<void> {
    const newMinifigSet: MinifigSet = { minifig, set };
    const currentMinifigSets = await retrieveSortedMinifigs(user);
    currentMinifigSets.push(newMinifigSet);
    await client.db("GameData").collection("SortedMinifigs").updateOne({ email: user.email }, { $set: { sortedMinifigs: currentMinifigSets } }, { upsert: true });
}