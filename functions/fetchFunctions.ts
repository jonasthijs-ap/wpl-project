import { Minifig } from "../types/types";
export async function getMinifigs(set_num: string): Promise<Minifig>{
    const response = await fetch(
        `https://rebrickable.com/api/v3/swagger/?key=55564703db4246a9f134ad8465a30a48#!/lego/lego_minifigs_read`, {headers: {Authorization: `key ${process.env.API_KEY}`}}
    );
    console.log(response);
    return (await response.json()) as Minifig;
}