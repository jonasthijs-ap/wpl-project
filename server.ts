// Importeren van modules
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { Minifig, Set, MinifigSet, Part, Blacklist, MinifigParts, Minifig_Set_FromAPI, User, UnsortedMinifigsGameData, BlacklistGameData } from "./types";
import { getRandomSets, getLoadOfNewMinifigsAtStart, getMinifigsOfSpecificSet, getNewMinifigsFromAPI, getPartsOfSpecificMinifig, getSetsFromSpecificMinifig, retrieveSingleMinifig, retrieveSingleSet } from "./functions/fetchFunctions";
import { client, connect, retrieveBlacklist, retrieveUnsortedMinifigs, retrieveSortedMinifigs, login, createNewUser, addMinifigToSet, updateBlacklistDB, updateUnsortedMinifigsDB } from "./database";
import { secureMiddleware } from "./secureMiddleware";
import session from "./session";
import bcrypt from "bcrypt";
import e from "express";

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
    counter = 0;
    maxCounter = 0;
    skippedMinifigs = [];
    bevestigdMinifigs = [];
    blacklistedMinifigs = [];
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        const unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs(user);
        maxCounter = unsortedMinifigs.length;
        res.render("homepagina", { minifigToOrder: unsortedMinifigs });
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
        res.status(200).json({ user });
        return;
    } catch (error) {
        res.status(401).json({ error: "Incorrect email or password" });
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
        let newUser: User | Error = await createNewUser(firstName, lastName, email, password);
        if (newUser instanceof Error) {
            res.json({ error: "Email is al in gebruik" });
            return;
        }
        newUser = await login(email, password);
        delete newUser.password; 
        req.session.user = newUser;
        let userUnsortedMinifigsDB: UnsortedMinifigsGameData = { email: req.session.user.email, unsortedMinifigs: await getLoadOfNewMinifigsAtStart() };
        await client.db("GameData").collection("UnsortedMinifigs").insertOne(userUnsortedMinifigsDB);
        res.status(200).json({ user: newUser });
        return;
    } catch (error) {
        res.json({ error: "Email is al in gebruik" });
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

app.post("/geordende-minifigs/remove/:figCode", secureMiddleware, async (req, res) => {
    let figCode: string = req.params.figCode;
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs(user);
        let updatedSortedMinifigs: MinifigSet[] = sortedMinifigs.filter(minifigSet => minifigSet.minifig.figCode!== figCode);
        await client.db("GameData").collection("SortedMinifigs").updateOne({ email: user.email }, { $set: { sortedMinifigs: updatedSortedMinifigs } });
        const minifig: Minifig = await retrieveSingleMinifig(req, figCode);
        const unsortedList: Minifig[] = await retrieveUnsortedMinifigs(user);
        unsortedList.push(minifig);
        await client.db("GameData").collection("UnsortedMinifigs").updateOne({ email: user.email }, { $set: { unsortedMinifigs: unsortedList } });
        
        res.redirect("/geordende-minifigs");
        return;
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


app.get("/minifigs-in-set/:setCode", secureMiddleware, async (req, res) => {
    let setCode: string = req.params.setCode;
    let set: Set = await retrieveSingleSet(setCode);
    let minifigs: Minifig[] = await getMinifigsOfSpecificSet(req, set);

    res.render("minifigs-in-set", { set, minifigsInSet: minifigs });
});

app.post("/password-reset", async (req, res) => {

    const { password } = req.body;
    
    const { email } = req.body;

    try {
        await client.db("LoginSystem").collection("Users").findOne({ email: email }).then(async (user) => {
            if (user === null) {
                res.redirect("/password-reset");
                return;
            }
            else {
                const hashedPassword: string = await bcrypt.hash(password, 10);
                await client.db("LoginSystem").collection("Users").updateOne({ email: email }, { $set: { password: hashedPassword } });
                res.redirect("/login");
                return;
            }
        });
    } catch (error) {
        res.redirect("/password-reset");
        return;
    }
});

app.get("/password-reset", async (req, res) => {
    res.render("password-reset");
});

app.post("/addNewMinifigToDatabase", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    const { minifigs } = req.body;
    maxCounter = parseInt(minifigs);
    const newMinifigs: Minifig[] = await getNewMinifigsFromAPI(req, parseInt(minifigs));
    await client.db("GameData").collection("UnsortedMinifigs").updateOne({ email: user!.email }, { $set: { unsortedMinifigs: newMinifigs } });
    maxCounter = parseInt(minifigs);
    res.redirect("/minifigs-ordenen");
});

app.get("/resultaten-ordenen", secureMiddleware, async (req, res) => {
    const usedMinifigs: Minifig[] = req.body.usedMinifigs;
    const skippedMinifigs: Minifig[] = req.body.skippedMinifigs;

    res.render("resultaten-ordenen", {usedMinifigs, skippedMinifigs});
    return;
});

let counter: number;
let maxCounter: number;

app.get("/minifigs-ordenen", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        const UnsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs(user);
        
        if (counter === maxCounter) {
            res.redirect("/resultaten");
            return;
        }
        if (UnsortedMinifigs.length == 0) {
            //let minifig = await getNewMinifigsFromAPI(1);
            res.redirect("/home");
            //einde van minifig ordenen de resultaten pagina tonen
            return;



        } else {
            let randomMinifig: Minifig = UnsortedMinifigs[Math.floor(Math.random() * UnsortedMinifigs.length)];
            let sets: Set[] = [];
            sets = await getSetsFromSpecificMinifig(req, randomMinifig);
            const randomSets: Set[] = await getRandomSets();
            if ( sets.length > 6) {
                sets.splice(6, sets.length - 6);
            }else {
                for (let i = sets.length ; i < 6; i++) {
                    sets.push(randomSets[i]);
                }
            }

            res.render("minifigs_ordenen", { minifigOrdenen: randomMinifig, sets });


        }
    }
});

//skip minifig lokaal opgeslagen

let skippedMinifigs: string[] = [];

app.post("/minifigs-ordenen/skip", secureMiddleware, async (req, res) => {

    const skippedMinifig = req.body.minifigId; 
    skippedMinifigs.push(skippedMinifig);
    counter++;

    res.redirect("/minifigs-ordenen");
});

let bevestigdMinifigs: string[] = [];

app.post("/minifigs-ordenen/bevestigen", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    const minifig = await retrieveSingleMinifig(req, req.body.minifigId);
    const set = await retrieveSingleSet(req.body.setsSelect);
    await addMinifigToSet(user!, minifig, set);
    // verwijder minifig uit unsortedMinifigs van de user
    const usersMinifigs = await client.db("GameData").collection("UnsortedMinifigs").findOne({ email: user?.email }, { projection: { unsortedMinifigs: 1 } });
    const newUnsortedMinifigs = usersMinifigs?.unsortedMinifigs?.filter((minifig: { figCode: string }) => minifig.figCode !== req.body.minifigId);
    if (usersMinifigs) {
        await client.db("GameData").collection("UnsortedMinifigs").updateOne({ email: user?.email }, { $set: { unsortedMinifigs: newUnsortedMinifigs } });
    }
    counter++;
    bevestigdMinifigs.push(req.body.minifigId);
    res.redirect("/minifigs-ordenen");
});

let blacklistedMinifigs: string[] = [];

app.post("/minifigs-ordenen/blacklist", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    const minifig = await retrieveSingleMinifig(req, req.body.minifigId);
    const reason = req.body.reason;
    const userBlacklist = await client.db("GameData").collection("Blacklist").findOne({ email: user?.email }, { projection: { blacklistedMinifigs: 1 } });
    if (userBlacklist) {
        const newBlacklist = { minifig, reason };
        userBlacklist.blacklistedMinifigs.push(newBlacklist);
        await client.db("GameData").collection("Blacklist").updateOne({ email: user?.email }, { $set: { blacklistedMinifigs: userBlacklist.blacklistedMinifigs } }, { upsert: true });
    } else {
        await client.db("GameData").collection("Blacklist").insertOne({ email: user?.email, blacklistedMinifigs: [{ minifig, reason }] });
    }
    // verwijder minifig uit unsortedMinifigs van de user
    const usersMinifigs = await client.db("GameData").collection("UnsortedMinifigs").findOne({ email: user?.email }, { projection: { unsortedMinifigs: 1 } });
    const newUnsortedMinifigs = usersMinifigs?.unsortedMinifigs?.filter((minifig: { figCode: string }) => minifig.figCode !== req.body.minifigId);
    if (usersMinifigs) {
        await client.db("GameData").collection("UnsortedMinifigs").updateOne({ email: user?.email }, { $set: { unsortedMinifigs: newUnsortedMinifigs } });
    }
    counter++;
    blacklistedMinifigs.push(req.body.minifigId);
    res.redirect("/minifigs-ordenen");
});

//gebruikte en skip miniffigs lokaal opgeslagen
app.get("/resultaten", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        //let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs(user);
        // filter through duplicates in skippedMinifigs
        for (let i = 0; i < skippedMinifigs.length; i++) {
            for (let j = i + 1; j < skippedMinifigs.length; j++) {
                if (skippedMinifigs[i] == skippedMinifigs[j]) {
                    skippedMinifigs.splice(j, 1);
                }
            }
        }
        
        res.render("resultaten-ordenen", { usedMinifigs : bevestigdMinifigs, skippedMinifigs, blacklistedMinifigs });
    }
});




app.post("/resultaten-ordenen/gebruikte-minifigs", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        const usedMinifigs: MinifigSet[] = await retrieveSortedMinifigs(user);
        res.render("gebruikte-minifigs", { usedMinifigs });
        return;
    }
});
app.post("/resultaten-ordenen/blacklist", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        const blacklistedMinifigs: Blacklist[] = await retrieveBlacklist(user);
        res.render("blacklist", { blacklistedMinifigs });
        return;
    }
});
app.post("/resultaten-ordenen/overgeslagen-minifigs", secureMiddleware, async (req, res) => {
    let skippedFigs: Minifig[] = [];
    for (let i = 0; i < skippedMinifigs.length; i++) {
        let fig = await retrieveSingleMinifig(req, skippedMinifigs[i]);
        skippedFigs.push(fig);
    }
    res.render("overgeslagen-minifigs", { skippedMinifigs : skippedFigs });
    return;
});

app.post("/minifigs-ordenen/addToBlacklist", secureMiddleware, async (req, res) => {
    const figCodeOfMinifigToBlacklist: string = req.body.figCode;
    const reasonOfBlacklisting: string = req.body.reason;

    let minifigToBlacklist: Minifig = await retrieveSingleMinifig(req, figCodeOfMinifigToBlacklist);
    let result: Blacklist = { reason: reasonOfBlacklisting, minifig: minifigToBlacklist };

    let user: User | undefined = req.session.user;
    
    if (user !== undefined) {
        // Find entity from unsorted list
        let unsortedList: Minifig[] = await retrieveUnsortedMinifigs(user);
        unsortedList = unsortedList.filter(value => value.figCode !== figCodeOfMinifigToBlacklist); // Filter out the selected entity

        // Push new entity to blacklist
        let blacklistList: Blacklist[] = await retrieveBlacklist(user);
        blacklistList.push(result);
        await updateBlacklistDB(user, blacklistList);
        
        // Remove entity from unsorted list
        await updateUnsortedMinifigsDB(user, unsortedList);

        res.redirect("/minifigs-ordenen");
        return;
    }
});

app.get("/blacklist", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    if (user !== undefined) {
        let blacklist: Blacklist[] = await retrieveBlacklist(user);
        res.render("blacklist", { blacklistedMinifigs: blacklist });
    }
});

app.post("/blacklist/changeReason", secureMiddleware, async (req, res) => {
    let figCodeOfMinifigToChangeReasonOf: string = req.body.minifig;
    let newReasonOfBlacklisting: string = req.body.reason;

    let user: User | undefined = req.session.user;

    if (user !== undefined) {
        let blacklistList: Blacklist[] = await retrieveBlacklist(user);
        blacklistList[blacklistList.findIndex(entity => entity.minifig.figCode === figCodeOfMinifigToChangeReasonOf)].reason = newReasonOfBlacklisting;
        
        await updateBlacklistDB(user, blacklistList);
        
        res.redirect("/blacklist");
        return;
    }
});

app.post("/blacklist/remove", secureMiddleware, async (req, res) => {
    let figCodeOfMinifigToRemove: string = req.body.minifig;

    let user: User | undefined = req.session.user;

    if (user !== undefined) {
        let blacklistList: Blacklist[] = await retrieveBlacklist(user);
        let minifig: Minifig | undefined = blacklistList.find(entity => entity.minifig.figCode === figCodeOfMinifigToRemove)?.minifig;
        blacklistList = blacklistList.filter(entity => entity.minifig.figCode !== figCodeOfMinifigToRemove);
        
        await updateBlacklistDB(user, blacklistList);

        if (minifig !== undefined) {
            let unsortedList: Minifig[] = await retrieveUnsortedMinifigs(user);
            unsortedList.push(minifig);

            await updateUnsortedMinifigsDB(user, unsortedList);
        }
        
        res.redirect("/blacklist");
        return;
    }
});

// Wanneer opgevraagde pagina niet gevonden wordt (HTTP 404 NOT FOUND), wordt dit opgeroepen in de middleware
app.use((req, res) => {
    res.status(404).render("not-found", { requestedUrl: req.url });
});

// HTTP 500 ERROR HANDLING
app.use((req, res) => {
    res.status(500 || 502).send("Sorry, er heeft een interne serverfout plaatsgevonden.");
});

// Maakt het mogelijk om de Express-applicatie te laten draaien op de ingestelde poort
app.listen(app.get("port"), async () => {
    await connect();
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});