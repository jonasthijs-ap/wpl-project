// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, MinifigSet, Part, Blacklist, MinifigParts, Minifig_Set_FromAPI, User, UnsortedMinifigsGameData } from "./types";
import { getLoadOfNewMinifigsAtStart, getMinifigsOfSpecificSet, getNewMinifigsFromAPI, getPartsOfSpecificMinifig, getSetsFromSpecificMinifig, retrieveSingleMinifig } from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist, retrieveUnsortedMinifigs, retrieveSortedMinifigs, login, createNewUser } from "./database";
import { secureMiddleware } from "./secureMiddleware";
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

app.get("/foute-game", (req, res) => {
    res.render("foutmeldingspagina");
});

app.get("/home", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        const unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs(user);
        res.render("homepagina", { unsortedMinifigs });
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/logout", secureMiddleware, async (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.post("/login", async (req, res) => {
    const email: string = req.body.email;
    const password: string = req.body.password;

    try {
        let user: User = await login(email, password);
        delete user.password; 
        req.session.user = user;
        res.redirect("/home");
        return;
    } catch (error) {
        res.redirect("/login");
        return;
    }
});

app.get("/registreren", (req, res) => {
    res.render("registreren");
});

app.post("/registreren", async (req, res) => {
    const firstName: string = req.body.firstName;
    const lastName: string = req.body.lastName;
    const email: string = req.body.email;
    const password: string = req.body.password;

    try {
        let newUser: User = await createNewUser(firstName, lastName, email, password);
        newUser = await login(email, password);
        delete newUser.password; 
        req.session.user = newUser;
        let userUnsortedMinifigsDB: UnsortedMinifigsGameData = { email: req.session.user.email, unsortedMinifigs: await getLoadOfNewMinifigsAtStart() };
        await client.db("GameData").collection("UnsortedMinifigs").insertOne(userUnsortedMinifigsDB);
        res.redirect("/home");
        return;
    } catch (error) {
        console.error(error);
        res.redirect("/registreren");
        return;
    }
});

app.get("/niet-geordende-minifigs", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        let unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs(user);
        res.render("niet-geordende-minifigs", { nietGeordendeMinifigs: unsortedMinifigs });
    }
});

app.get("/geordende-minifigs", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs(user);
        res.render("geordende-minifigs", { sortedMinifigs });
    }
});

app.get("/sets-met-bepaalde-minifig/:figCode", secureMiddleware, async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(req, figCode);
    let sets: Set[] = await getSetsFromSpecificMinifig(req, minifig);
    
    res.render("sets-met-bepaalde-minifig", { minifig, setsMetBepaaldeMinifig: sets });
});

app.get("/minifig-onderdelen/:figCode", secureMiddleware, async (req, res) => {
    let figCode: string = req.params.figCode;
    let minifig: Minifig = await retrieveSingleMinifig(req, figCode);
    let minifigWithParts: MinifigParts = await getPartsOfSpecificMinifig(req, minifig);
    
    res.render("minifig-onderdelen", { minifig: minifigWithParts.minifig, parts: minifigWithParts.parts });
});

/* app.get("/minifigs-in-set/:setCode", secureMiddleware, async (req, res) => {
    let setCode: string = req.params.setCode;
    let set: Set = await retrieveSingleSet(setCode);
    let minifigs: Minifig[] = await getMinifigsOfSpecificSet(set);
    
    res.render("minifig-onderdelen", { set, minifigsInSet: minifigs });
}); */

app.post("/resultaten-ordenen", secureMiddleware, async (req, res) => {
    const usedMinifigs: Minifig[] = req.body.usedMinifigs;
    const skippedMinifigs: Minifig[] = req.body.skippedMinifigs;

    res.render("resultaten-ordenen", { usedMinifigs, skippedMinifigs });
    return;
});

app.post("/resultaten-ordenen/gebruikte-minifigs", secureMiddleware, async (req, res) => {
    const usedMinifigs: Minifig[] = JSON.parse(req.body.usedMinifigs);

    res.render("gebruikte-minifigs", { usedMinifigs });
    return;
});

app.post("/resultaten-ordenen/overgeslagen-minifigs", secureMiddleware, async (req, res) => {
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