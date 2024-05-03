export interface Minifig {
    name: string;
    figCode: string;
    imageUrl: string;
}

export interface Set {
    name: string;
    setCode: string;    
    imageUrl: string;
}

export interface MinifigSet {
    minifig: Minifig;
    set: Set;
}

export interface Part {
    name: string;
    partNumber: string;
}

export interface Blacklist {
    reason: string;
    minifig: Minifig;
}

export interface MinifigParts {
    minifig: Minifig;
    parts: Part;
}