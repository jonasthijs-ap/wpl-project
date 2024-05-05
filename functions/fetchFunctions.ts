import { Minifig, Set, MinifigSet, Minifig_Set_FromAPI, Parts_FromAPI, MinifigParts, Part } from "../types";
import { client, retrieveSortedMinifigs, retrieveUnsortedMinifigs } from "../database";
import dotenv from "dotenv";
import { randomInt } from "crypto";

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
        `https://rebrickable.com/api/v3/lego/minifigs?page_size=25`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
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

export async function retrieveSingleMinifig(figCode: string): Promise<Minifig> {
    let outputMinifig: Minifig;
    const minifigFromDB: Minifig | null = await client.db("Session").collection("ApiMinifigs").findOne<Minifig>({ figCode: figCode });

    if (minifigFromDB != null) {
        console.info("Er is geen gebruik gemaakt van de API, maar wel van de DB om de minifig op te halen.");
        outputMinifig = minifigFromDB;
    } else {
        console.info("Er is wel gebruik gemaakt van de API om de minifig op te halen.");
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/minifigs/${figCode}`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
        );
        const result: Minifig_Set_FromAPI = await response.json();
        outputMinifig = {
            name: result.name,
            figCode: result.set_num,
            imageUrl: result.set_img_url
        };
        client.db("Session").collection("ApiMinifigs").insertOne(outputMinifig);
    }

    return new Promise<Minifig>((resolve, reject) => {
        try {
            resolve(outputMinifig);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getNewMinifigsFromAPI(count: number): Promise<Minifig[]> {
    let notAvailableFigCodes: string[] = [];
    let figCodesForNewMinifigs: string[] = [];
    
    let unsortedMinifigs: Minifig[] = await retrieveUnsortedMinifigs();
    let sortedMinifigs: MinifigSet[] = await retrieveSortedMinifigs();

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

    const output: Minifig[] = convert_MinifigsFromAPI_ToMinifigs(newMinifigs);

    return new Promise<Minifig[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getSetsFromSpecificMinifig(minifig: Minifig): Promise<Set[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/sets`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;

    const output: Set[] = convert_SetsFromAPI_ToSets(result);

    return new Promise<Set[]>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getPartsOfSpecificMinifig(minifig: Minifig): Promise<MinifigParts> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/parts?inc_color_details=0`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Parts_FromAPI[] = (await response.json()).results;

    const output: MinifigParts = convert_PartsFromAPI_ToMinifigsParts(minifig, result);

    return new Promise<MinifigParts>((resolve, reject) => {
        try {
            resolve(output);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getMinifigsOfSpecificSet(set: Set): Promise<Minifig[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/sets/${set.setCode}/minifigs`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
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