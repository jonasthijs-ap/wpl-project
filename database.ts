import { MongoClient, ObjectId } from "mongodb";
import { Blacklist, MinifigParts, Part } from "./types";
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



export async function retrieveBlacklist() : Promise<Blacklist[]> {
    let cursor = client.db("GameData").collection("Blacklist").find<Blacklist>({});
    let blacklist: Blacklist[] = await cursor.toArray();
    return new Promise<Blacklist[]>((resolve, reject) => {
        resolve(blacklist);
    });
}