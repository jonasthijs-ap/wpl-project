// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, MinifigSet, Part, Blacklist, MinifigParts, Minifig_Set_FromAPI } from "./types";
import { getLoadOfNewMinifigsAtStart, getNewMinifigsFromAPI, getSetsFromSpecificMinifig } from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist, retrieveUnsortedMinifigs, retrieveSortedMinifigs } from "./database";

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
app.get("/niet-geordende-minifigs", async (req, res) => {
    let unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs();
    res.render("niet-geordende-minifigs", { nietGeordendeMinifigs: unsortedMinifigs });
});

app.get("/geordende-minifigs", async (req, res) => {
    let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs();
    res.render("geordende-minifigs", { sortedMinifigs });
});

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    await connect();
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
    /* let old_minifigs: Minifig_Set_FromAPI[] = await getLoadOfNewMinifigsAtStart();
    console.log(old_minifigs);
    let minifigs: Minifig[] = old_minifigs.map(value => {
        const currentMinifig: Minifig = {
            name: value.name,
            figCode: value.set_num,
            imageUrl: value.set_img_url
        }
        return currentMinifig;
    });
    await client.db("GameData").collection("UnsortedMinifigs").insertMany(minifigs); */
});