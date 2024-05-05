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
    // let blacklist: Blacklist[] = await retrieveBlacklist();
    let tijdelijkeBlacklist: Blacklist[] = [
        {
            reason: "Niet meer voor mijn leeftijd",
            minifig: {
                name: "Kinderlego",
                figCode: "fig-11111",
                imageUrl: "https://www.pixelstalk.net/wp-content/uploads/2016/09/Best-Beautiful-Images-For-Desktop-Nature.png"
            }
        },
        {
            reason: "Niet meer voor mijn leeftijd",
            minifig: {
                name: "Kinderlego",
                figCode: "fig-22222",
                imageUrl: "https://www.pixelstalk.net/wp-content/uploads/2016/09/Best-Beautiful-Images-For-Desktop-Nature.png"
            }
        },
        {
            reason: "Niet meer voor mijn leeftijd",
            minifig: {
                name: "Kinderlego",
                figCode: "fig-33333",
                imageUrl: "https://www.pixelstalk.net/wp-content/uploads/2016/09/Best-Beautiful-Images-For-Desktop-Nature.png"
            }
        }
    ];
    res.render("blacklist", { blacklistedMinifigs: tijdelijkeBlacklist });
});

app.post("/blacklist/changeReason", (req, res) => {
    let figCodeOfMinifigToChangeReasonOf: string = req.body.minifig;
    let reasonOfBlacklisting: string = req.body.reason;
    console.log(`FIGCODE:\t${figCodeOfMinifigToChangeReasonOf}\nREASON:\t\t${reasonOfBlacklisting}`);
    res.redirect("/blacklist");
    return;
});

app.post("/blacklist/remove", (req, res) => {
    let figCodeOfMinifigToRemove: string = req.body.minifig;
    console.log(figCodeOfMinifigToRemove);
    res.redirect("/blacklist");
    return;
});

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    await connect();
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});