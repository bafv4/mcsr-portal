export type Locales = 'ja' | 'en';
export type Tag = "mod" | "installer" | "zip" | "jar" | "other";

export interface Step {
    id: string,
    optional: boolean,
}

export interface Item {
    id: string;
    name: string;
    description?: string;
    options: Option[];
    traits?: string[];
    version?: string;
}

export interface Option {
    id: string;
    name: string;
    description?: string;
    url: string;
    tag?: "zip" | "installer" | "jar";
    optionsName?: string;
    options?: Option[];
    traits?: string[];
}

export interface InstanceOptions {
    name: string,
    version: string,
    java: {
        path: string,
        args: string
    },
    fabric?: string
}

export interface UpdateResult {
    success: boolean;
    hasUpdate?: boolean;
    error?: string;
}