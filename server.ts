// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, Part, Blacklist, MinifigParts } from "./types";
import * as fetchFunctions from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist } from "./database";

dotenv.config();

// .env-settings
dotenv.config();

// Aanmaken Express-applicatie en connectie met MongoDB maken
const app: express.Express = express();

// Omgevingsvariabelen en Express-variabelen
app.set("view engine", "ejs");
app.set("port", process.env.PORT);

// Map met statische bestanden definiëren (zoals foto's, video's, fonts, ...)
app.use(express.static("public"));

// Maakt POST-requests met JSON mogelijk
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Express-routes
app.get("/blacklist", async (req, res) => {
    let blacklist: Blacklist[] = await retrieveBlacklist();
    res.render("blacklist", { blacklistedMinifigs: blacklist });
});

app.post("/blacklist/changeReason", async (req, res) => {
    let figCodeOfMinifigToChangeReasonOf: string = req.body.minifig;
    let newReasonOfBlacklisting: string = req.body.reason;
    client.db("GameData").collection("Blacklist").updateOne({ "minifig.figCode": figCodeOfMinifigToChangeReasonOf }, { $set: { reason: newReasonOfBlacklisting } });

    res.redirect("/blacklist");
    return;
});

app.post("/blacklist/remove", async (req, res) => {
    let figCodeOfMinifigToRemove: string = req.body.minifig;
    let result = await client.db("GameData").collection("Blacklist").deleteOne({ "minifig.figCode": figCodeOfMinifigToRemove });
    console.log(result);
    
    res.redirect("/blacklist");
    return;
});

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    await connect();
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});