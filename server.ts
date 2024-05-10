// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, MinifigSet, Part, Blacklist, MinifigParts, Minifig_Set_FromAPI } from "./types";
import { getLoadOfNewMinifigsAtStart, getMinifigsOfSpecificSet, getNewMinifigsFromAPI, getPartsOfSpecificMinifig, getSetsFromSpecificMinifig, retrieveSingleMinifig } from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist, retrieveUnsortedMinifigs, retrieveSortedMinifigs } from "./database";
import session from "./session";

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

// Maakt het gebruik van sessions mogelijk in de pipeline
app.use(session);

// Express-routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/home", async (req, res) => {
    res.render("homepagina");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {});

app.get("/niet-geordende-minifigs", async (req, res) => {
    let unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs();
    res.render("niet-geordende-minifigs", { nietGeordendeMinifigs: unsortedMinifigs });
});

app.get("/geordende-minifigs", async (req, res) => {
    let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs();
    res.render("geordende-minifigs", { sortedMinifigs });
});

app.get("/sets-met-bepaalde-minifig/:figCode", async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(figCode);
    let sets: Set[] = await getSetsFromSpecificMinifig(minifig);
    
    res.render("sets-met-bepaalde-minifig", { minifig, setsMetBepaaldeMinifig: sets });
});

app.get("/minifig-onderdelen/:figCode", async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(figCode);
    let minifigWithParts: MinifigParts = await getPartsOfSpecificMinifig(minifig);
    
    res.render("minifig-onderdelen", { minifig: minifigWithParts.minifig, parts: minifigWithParts.parts });
});

/* app.get("/minifigs-in-set/:setCode", async (req, res) => {
    let setCode: string = req.params.setCode;
    let set: Set = await retrieveSingleSet(setCode);
    let minifigs: Minifig[] = await getMinifigsOfSpecificSet(set);
    
    res.render("minifig-onderdelen", { set, minifigsInSet: minifigs });
}); */

app.get("/resultaten-ordenen", async (req, res) => {
    const usedMinifigs: Minifig[] = req.body.usedMinifigs;
    const skippedMinifigs: Minifig[] = req.body.skippedMinifigs;

    res.render("resultaten-ordenen", { usedMinifigs, skippedMinifigs });
    return;
});

app.post("/resultaten-ordenen/gebruikte-minifigs", async (req, res) => {
    const usedMinifigs: Minifig[] = JSON.parse(req.body.usedMinifigs);

    res.render("gebruikte-minifigs", { usedMinifigs });
    return;
});

app.post("/resultaten-ordenen/overgeslagen-minifigs", async (req, res) => {
    const skippedMinifigs: Minifig[] = JSON.parse(req.body.skippedMinifigs);

    res.render("overgeslagen-minifigs", { skippedMinifigs });
    return;
});

// Wanneer opgevraagde pagina niet gevonden wordt (HTTP 404 NOT FOUND), wordt dit opgeroepen in de middleware
app.use((req, res) => {
    res.status(404).render("not-found", { requestedUrl: req.url });
});

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    await connect();
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});