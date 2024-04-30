import { Minifig } from "../types";
import dotenv from "dotenv";

export async function getMinifigs(set_num: string): Promise<Minifig>{
    const response = await fetch(
        "https://rebrickable.com/api/v3/lego/", {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    console.log(response);
    return (await response.json()) as Minifig;
}