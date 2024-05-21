import { ObjectId } from "mongodb";

export interface User {
    _id?: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: "ADMIN" | "USER";
}

// Lists of game data with user-related objects/data

export interface BlacklistGameData {
    _id?: ObjectId;
    email: string;
    blacklistedMinifigs: Blacklist[];
}

export interface SortedMinifigsGameData {
    _id?: ObjectId;
    email: string;
    sortedMinifigs: MinifigSet[];
}

export interface UnsortedMinifigsGameData {
    _id?: ObjectId;
    email: string;
    unsortedMinifigs: Minifig[];
}

// General entity interfaces

export interface Minifig {
    _id?: ObjectId;
    name: string;
    figCode: string;
    imageUrl: string;
}

export interface Set {
    _id?: ObjectId;
    name: string;
    setCode: string;
    imageUrl: string;
}

export interface MinifigSet {
    _id?: ObjectId;
    minifig: Minifig;
    set: Set;
}

export interface Part {
    name: string;
    imageUrl: string;
}

export interface Blacklist {
    _id?: ObjectId;
    reason: string;
    minifig: Minifig;
}

export interface MinifigParts {
    _id?: ObjectId;
    minifig: Minifig;
    parts: Part[];
}


// Types for fetching from API
export interface Minifig_Set_FromAPI {
    set_num: string;
    name: string;
    num_parts: number;
    set_img_url: string;
    set_url: string;
    last_modified_dt: Date;
}

export interface Parts_FromAPI {
    id: number;
    inv_part_id: number;
    part: Part_FromAPI;
    color: Color;
    set_num: string;
    quantity: number;
    is_spare: boolean;
    element_id: string;
    num_sets: number;
}

interface Part_FromAPI {
    part_num: string;
    name: string;
    part_cat_id: number;
    part_url: string;
    part_img_url: string;
    external_ids: ExternalIDS;
    print_of: null | string;
}

interface Color {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
}

interface ExternalIDS {
    BrickLink: string[];
    BrickOwl: string[];
    Brickset: string[];
    LEGO: string[];
    LDraw?: string[];
}