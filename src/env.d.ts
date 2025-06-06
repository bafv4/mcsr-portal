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

/** ## 進捗状況
 * 0=開始前 1=ダウンロード中 2=解凍中 3=インストール中 4=終わり */
export type State = 0 | 1 | 2 | 3 | 4;