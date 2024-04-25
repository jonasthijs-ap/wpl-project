// Importeren van modules
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import * as Interfaces from "./types/types";
import * as fetchFunctions from "./functions/fetchFunctions";

// Aanmaken Express-applicatie en connectie met MongoDB maken
const app: express.Express = express();
const client: MongoClient = new MongoClient();

// Map met statische bestanden definiëren (zoals foto's, video's, fonts, ...)
app.use(express.static("public"));

// Maakt POST-requests met JSON mogelijk
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Express-variabelen aanmaken zoals mogelijk maken van rendering van EJS en de applicatiepoort instellen
app.set("view engine", "ejs");
app.set("port", 3000);

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});