export interface Minifigs{
count: number;
next: string;
previous: string;
results: Minifig[]; 
}

export interface Minifig {
    set_num: string;
    name: string;
    num_parts: number;
    set_img_url: string;
    set_url: string;
    last_modified_dt: string;
}

export interface LegoElement{
    id: number;
    inv_part_id: number;
    part: Part;
    set_num: string;
    quantity: number;
    is_spare: boolean;
    element_id: string;
    num_sets: number;
}

export interface Part{
    part_num: string;
    name: string;
    part_cat_id: number;
    part_url: string;
    part_img_url: string;
}

export interface Sets{
    count: number;
  next: string;
  previous: string;
  results: Set[];
}

export interface Set{
    set_num: number;
      name: string;
      year: number;
      theme_id: number;
      num_parts: number;
      set_img_url: string;
      set_url: string;
      last_modified_dt: string;
}