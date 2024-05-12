// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, MinifigSet, Part, Blacklist, MinifigParts, Minifig_Set_FromAPI } from "./types";
import { get5RandomSets, getLoadOfNewMinifigsAtStart, getMinifigsOfSpecificSet, getNewMinifigsFromAPI, getPartsOfSpecificMinifig, getSetsFromSpecificMinifig, retrieveSingleMinifig, retrieveSingleSet } from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist, retrieveUnsortedMinifigs, retrieveSortedMinifigs, addMinifigToSet } from "./database";

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

app.get("/sets-met-bepaalde-minifig/:figCode", async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(figCode);
    let sets: Set[] = await getSetsFromSpecificMinifig(minifig);

    res.render("sets-met-bepaalde-minifig", { minifig, setsMetBepaaldeMinifig: sets });
});

app.get("")

app.get("/minifig-onderdelen/:figCode", async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(figCode);
    let minifigWithParts: MinifigParts = await getPartsOfSpecificMinifig(minifig);

    res.render("minifig-onderdelen", { minifig: minifigWithParts.minifig, parts: minifigWithParts.parts });
});


app.get("/minifigs-in-set/:setCode", async (req, res) => {
    let setCode: string = req.params.setCode;
    let set: Set = await retrieveSingleSet(setCode);
    let minifigs: Minifig[] = await getMinifigsOfSpecificSet(set);

    res.render("minifig-onderdelen", { set, minifigsInSet: minifigs });
});

app.get("/home", async (req, res) => {
    res.render('homepagina');
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/resultaten-ordenen", async (req, res) => {
    const usedMinifigs: Minifig[] = req.body.usedMinifigs;
    const skippedMinifigs: Minifig[] = req.body.skippedMinifigs;

    res.render("resultaten-ordenen", { usedMinifigs, skippedMinifigs });
    return;
});

app.get("/minifigs-ordenen", async (req, res) => {
    let UnsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs();
    let randomMinifig = UnsortedMinifigs[Math.floor(Math.random() * UnsortedMinifigs.length)];
    let sets: Set[] = [];
    sets = await get5RandomSets();
    let setsFromMinifig = await getSetsFromSpecificMinifig(randomMinifig);
    sets.push(setsFromMinifig[0]);
    if (UnsortedMinifigs.length == 0) {
        let minifig = await getNewMinifigsFromAPI(1);
        res.render("minifigs_ordenen", { minifigOrdenen: minifig, sets });




    } else {


        res.render("minifigs_ordenen", { minifigOrdenen: randomMinifig, sets });


    }

});

//skip minifig lokaal opgeslagen

let skippedMinifigs: string[] = [];

app.post("/minifigs-ordenen/skip", async (req, res) => {
    const skippedMinifig = req.body.minifigId; 
    skippedMinifigs.push(skippedMinifig);
    res.redirect("/minifigs-ordenen");
});

app.post("/minifigs-ordenen/bevestigen", async (req, res) => {
    const minifig = await retrieveSingleMinifig(req.body.minifigId);
    const set = await retrieveSingleSet(req.body.setsSelect);
    await addMinifigToSet(minifig, set);
    res.redirect("/minifigs-ordenen");
});

//gebruikte en skip miniffigs lokaal opgeslagen
app.get("/resultaten", async (req, res) => {
    let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs();
    res.render("resultaten-ordenen", { usedMinifigs : sortedMinifigs, skippedMinifigs });
});




app.post("/resultaten-ordenen/gebruikte-minifigs", async (req, res) => {
    const usedMinifigs: MinifigSet[] = await retrieveSortedMinifigs();
    console.log(usedMinifigs);
    res.render("gebruikte-minifigs", { usedMinifigs });
    return;
});

app.post("/resultaten-ordenen/overgeslagen-minifigs", async (req, res) => {
    let skippedFigs: Minifig[] = [];
    for (let i = 0; i < skippedMinifigs.length; i++) {
        let fig = await retrieveSingleMinifig(skippedMinifigs[i]);
        skippedFigs.push(fig);
    }
    console.log(skippedFigs);
    res.render("overgeslagen-minifigs", { skippedMinifigs : skippedFigs });
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