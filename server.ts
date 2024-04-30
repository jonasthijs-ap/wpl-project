// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import * as Interfaces from "./types";
import * as fetchFunctions from "./functions/fetchFunctions";

dotenv.config();

// .env-settings
dotenv.config();

// Aanmaken Express-applicatie en connectie met MongoDB maken
const app: express.Express = express();
const client: MongoClient = new MongoClient(process.env.MONGO_URI || "");

// Omgevingsvariabelen en Express-variabelen
app.set("view engine", "ejs");
app.set("port", process.env.PORT);

// Map met statische bestanden definiëren (zoals foto's, video's, fonts, ...)
app.use(express.static("public"));

// Maakt POST-requests met JSON mogelijk
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});