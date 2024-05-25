import { Minifig, Set, MinifigSet, Minifig_Set_FromAPI, Parts_FromAPI, MinifigParts, Part, User } from "../types";
import { client, retrieveSortedMinifigs, retrieveUnsortedMinifigs } from "../database";
import dotenv from "dotenv";
import { randomInt } from "crypto";
import { ObjectId } from "mongodb";

dotenv.config();

function convert_MinifigsFromAPI_ToMinifigs(minifigs: Minifig_Set_FromAPI[]): Minifig[] {
    let output: Minifig[] = minifigs.map(value => {
        return {
            name: value.name,
            figCode: value.set_num,
            imageUrl: value.set_img_url
        }
    });
    return output;
}

function convert_SetsFromAPI_ToSets(sets: Minifig_Set_FromAPI[]): Set[] {
    let output: Set[] = sets.map(value => {
        return {
            name: value.name,
            setCode: value.set_num,
            imageUrl: value.set_img_url
        }
    });
    return output;
}

function convert_PartsFromAPI_ToMinifigsParts(minifig: Minifig, parts: Parts_FromAPI[]): MinifigParts {
    let convertedParts: Part[] = parts.map(value => {
        return {
            name: value.part.name,
            imageUrl: value.part.part_img_url
        }
    });
    return { minifig: minifig, parts: convertedParts };
}

export async function getLoadOfNewMinifigsAtStart(): Promise<Minifig[]> {
    const response = await fetch(
        "https://rebrickable.com/api/v3/lego/minifigs?page_size=5", { headers: { Authorization: `key ${process.env.API_KEY}` } }
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;

    const output: Minifig[] = convert_MinifigsFromAPI_ToMinifigs(result);

    return new Promise<Minifig[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function retrieveSingleMinifig(req: Express.Request, figCode: string): Promise<Minifig> {
    let outputMinifig: Minifig;
    const minifigFromDB: Minifig | undefined = req.session.cachedMinifigs?.find(value => value.figCode === figCode);/*await client.db("Session").collection("ApiMinifigs").findOne<Minifig>({ figCode: figCode });*/

    if (minifigFromDB != undefined) {
        console.info("Er is geen gebruik gemaakt van de API, maar wel van de DB om de minifig op te halen.");
        outputMinifig = minifigFromDB;
    } else {
        console.info("Er is wel gebruik gemaakt van de API om de minifig op te halen.");
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/minifigs/${figCode}`, { headers: { Authorization: `key ${process.env.API_KEY}` } }
        );
        const result: Minifig_Set_FromAPI = await response.json();
        outputMinifig = {
            name: result.name,
            figCode: result.set_num,
            imageUrl: result.set_img_url
        };
        let cachedMinifigs: Minifig[] = req.session.cachedMinifigs ? req.session.cachedMinifigs : [];
        cachedMinifigs.push(outputMinifig);
        req.session.cachedMinifigs = [...cachedMinifigs];
    }

    return new Promise<Minifig>((resolve, reject) => {
        try {
            resolve(outputMinifig);
        } catch (error) {
            reject(error);
        }
    });
}
export async function retrieveSingleSet(setCode: string): Promise<Set> {
    let outputSet: Set;
    const setFromDB: Set | null = await client.db("Session").collection("ApiSets").findOne<Set>({ setCode: setCode });

    if (setFromDB != null) {
        console.info("Er is geen gebruik gemaakt van de API, maar wel van de DB om de set op te halen.");
        outputSet = setFromDB;
    } else {
        console.info("Er is wel gebruik gemaakt van de API om de set op te halen.");
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/sets/${setCode}`, { headers: { Authorization: `key ${process.env.API_KEY}` } }
        );
        const result: Minifig_Set_FromAPI = await response.json();
        outputSet = {
            name: result.name,
            setCode: result.set_num,
            imageUrl: result.set_img_url
        };
        client.db("Session").collection("ApiSets").insertOne(outputSet);
    }
    return new Promise<Set>((resolve, reject) => {
        try {
            resolve(outputSet);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getNewMinifigsFromAPI(req: Express.Request, count: number): Promise<Minifig[]> {
    let notAvailableFigCodes: string[] = [];
    let figCodesForNewMinifigs: string[] = [];

    let user: User | undefined = req.session.user;
    let output: Minifig[];
    
    if (user !== undefined) {
        let unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs(user);
        let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs(user);
        
        notAvailableFigCodes = unsortedMinifigs.map(value => value.figCode);
        sortedMinifigs = sortedMinifigs.filter(value => {
            if (!notAvailableFigCodes.includes(value.minifig.figCode)) return true;
            else return false;
        });
        notAvailableFigCodes = sortedMinifigs.map(value => value.minifig.figCode);

        for (let i: number = 0; i < count; i++) {
            let randomFigCode: string = "fig-";
            do {
                let currentCode: string = randomInt(14993).toString();
                currentCode = currentCode.padStart(6, "0");
                randomFigCode += currentCode;
            } while (notAvailableFigCodes.includes(randomFigCode));
            figCodesForNewMinifigs.push(randomFigCode);
        }
        
        let newMinifigs: Minifig_Set_FromAPI[] = [];
        
        for (let currentFigCode of figCodesForNewMinifigs) {
            const response = await fetch(
                `https://rebrickable.com/api/v3/lego/minifigs/${currentFigCode}`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
            );
            const result: Minifig_Set_FromAPI = await response.json();
            newMinifigs.push(result);
            await setTimeout(() => {}, 1500);
        }
        
        output = convert_MinifigsFromAPI_ToMinifigs(newMinifigs);

    }
    return new Promise<Minifig[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getSetsFromSpecificMinifig(req: Express.Request, minifig: Minifig): Promise<Set[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/sets`, { headers: { Authorization: `key ${process.env.API_KEY}` } }
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;

    const output: Set[] = convert_SetsFromAPI_ToSets(result);

    let cachedSets: Set[] = req.session.cachedSets ? req.session.cachedSets : [];
    cachedSets.push(...output);
    req.session.cachedSets = [...cachedSets];

    return new Promise<Set[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}



export async function getPartsOfSpecificMinifig(req: Express.Request, minifig: Minifig): Promise<MinifigParts> {
    let outputMinifigWithParts: MinifigParts;
    const minifigFromDB: Minifig | undefined = req.session.cachedMinifigs?.find(value => value.figCode === minifig.figCode);
    const minifigWithPartsFromDB: MinifigParts | undefined = req.session.cachedMinifigParts?.find(value => value.minifig.figCode === minifigFromDB?.figCode);

    if (minifigWithPartsFromDB != undefined) {
        console.info("Er is geen gebruik gemaakt van de API, maar wel van de DB om de minifig en haar onderdelen op te halen.");
        outputMinifigWithParts = minifigWithPartsFromDB;
    } else {
        console.info("Er is wel gebruik gemaakt van de API om de minifig en haar onderdelen op te halen.");
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/parts?inc_color_details=0`, { headers: { Authorization: `key ${process.env.API_KEY}` } }
        );
        const result: Parts_FromAPI[] = (await response.json()).results;

        outputMinifigWithParts = convert_PartsFromAPI_ToMinifigsParts(minifig, result);

        let cachedMinifigsParts: MinifigParts[] = req.session.cachedMinifigParts ? req.session.cachedMinifigParts : [];
        cachedMinifigsParts.push(outputMinifigWithParts);
        req.session.cachedMinifigParts = [...cachedMinifigsParts];
    }

    return new Promise<MinifigParts>((resolve, reject) => {
        try {
            resolve(outputMinifigWithParts);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getMinifigsOfSpecificSet(req: Express.Request, set: Set): Promise<Minifig[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/sets/${set.setCode}/minifigs`, { headers: { Authorization: `key ${process.env.API_KEY}` } }
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;

    const output: Minifig[] = convert_MinifigsFromAPI_ToMinifigs(result);

    let cachedMinifigs: Minifig[] = req.session.cachedMinifigs ? req.session.cachedMinifigs : [];
    cachedMinifigs.push(...output);
    req.session.cachedMinifigs = [...cachedMinifigs];

    return new Promise<Minifig[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function get6RandomSets(): Promise<Set[]> {
    let sets: any[] = [];
    for (let i = 0; i < 6; i++) {
        const randomNumber = Math.floor(Math.random() * 3785 + 1);
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/sets/?key=55564703db4246a9f134ad8465a30a48&page=${randomNumber}&page_size=6`
        );
        const result: any = await response.json();
        sets.push(result.results[i]);
    }
    const output: Set[] = convert_SetsFromAPI_ToSets(sets);
    return output;
}