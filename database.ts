import { MongoClient, ObjectId } from "mongodb";
import { Minifig, MinifigSet, Blacklist, MinifigParts, Part, Set } from "./types";
import dotenv from "dotenv";

dotenv.config();


export const client: MongoClient = new MongoClient(process.env.MONGO_URI || "");

// Async connect functions
export const connect = async () => {
    try {
        await client.connect();
        console.info("Connected to database");
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

// Async database query functions
export async function retrieveBlacklist(): Promise<Blacklist[]> {
    let cursor = client.db("GameData").collection("Blacklist").find<Blacklist>({});
    let blacklist: Blacklist[] = await cursor.toArray();
    return new Promise<Blacklist[]>((resolve, reject) => {
        resolve(blacklist);
    });
}

export async function retrieveUnsortedMinifigs(): Promise<Minifig[]> {
    let cursor = client.db("GameData").collection("UnsortedMinifigs").find<Minifig>({});
    let result: Minifig[] = await cursor.toArray();

    return new Promise<Minifig[]>((resolve, reject) => {
        resolve(result);
    });
}

export async function retrieveSortedMinifigs(): Promise<MinifigSet[]> {
    let cursor = client.db("GameData").collection("SortedMinifigs").find<MinifigSet>({});
    let result: MinifigSet[] = await cursor.toArray();

    return new Promise<MinifigSet[]>((resolve, reject) => {
        resolve(result);
    });
}

export async function addMinifigToSet(minifig: Minifig, set: Set): Promise<void> {
    await client.db("GameData").collection("SortedMinifigs").insertOne({ minifig: minifig, set: set });
}