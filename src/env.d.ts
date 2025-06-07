export type Locales = 'ja' | 'en';
export type Tag = "mod" | "installer" | "zip" | "jar" | "other";

export interface Step {
    id: string,
    optional: boolean,
}

export interface Item {
    [key: string]: any;
    id: string;
    name: string;
    optionsName?: string,
    options: Option[];
    selectedOption?: Option;
}

export interface Option {
    [key: string]: any,
    id: string,
    name: string,
    url: string,
    tag?: Tag,
}