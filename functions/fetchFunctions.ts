import { Minifig, Set, MinifigSet, Minifig_Set_FromAPI, Parts_FromAPI } from "../types";
import { client, retrieveSortedMinifigs, retrieveUnsortedMinifigs } from "../database";
import dotenv from "dotenv";
import { randomInt } from "crypto";

dotenv.config();

export async function getLoadOfNewMinifigsAtStart(): Promise<Minifig_Set_FromAPI[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs?page_size=25`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;

    return new Promise<Minifig_Set_FromAPI[]>((resolve, reject) => {
        try {
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getNewMinifigsFromAPI(count: number): Promise<Minifig_Set_FromAPI[]> {
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

    let figCodesString: string = figCodesForNewMinifigs.join(",");
    console.log(figCodesString);
    
    let newMinifigs: Minifig_Set_FromAPI[] = [];

    for (let currentFigCode of figCodesForNewMinifigs) {
        const response = await fetch(
            `https://rebrickable.com/api/v3/lego/minifigs/${currentFigCode}`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
        );
        const result: Minifig_Set_FromAPI = (await response.json()).results;
        newMinifigs.push(result);
        await setTimeout(() => {}, 1500);
    }

    return new Promise<Minifig_Set_FromAPI[]>((resolve, reject) => {
        try {
            resolve(newMinifigs);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getSetsFromSpecificMinifig(minifig: Minifig): Promise<Minifig_Set_FromAPI[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/sets`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;
    return new Promise<Minifig_Set_FromAPI[]>((resolve, reject) => {
        try {
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getPartsOfSpecificMinifig(minifig: Minifig): Promise<Parts_FromAPI[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/minifigs/${minifig.figCode}/parts?inc_color_details=0`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Parts_FromAPI[] = (await response.json()).results;
    return new Promise<Parts_FromAPI[]>((resolve, reject) => {
        try {
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

export async function getMinifigsOfSpecificSet(set: Set): Promise<Minifig_Set_FromAPI[]> {
    const response = await fetch(
        `https://rebrickable.com/api/v3/lego/sets/${set.setCode}/minifigs`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    const result: Minifig_Set_FromAPI[] = (await response.json()).results;
    return new Promise<Minifig_Set_FromAPI[]>((resolve, reject) => {
        try {
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}