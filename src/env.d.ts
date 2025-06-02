type Tag = "mod" | "installer" | "zip" | "jar" | "other";

export type Locales = 'ja' | 'en';

export interface ItemInfo {
    id: string,
    options: Option[],
    props?: Record<string, any>,   // もし使わなかったら削除
}

export interface Option {
    key: string,
    name: string,
    url: string,
    ver?: string,
    tag?: Tag,
}

/** ## 進捗状況
 * 0=開始前 1=ダウンロード中 2=解凍中 3=インストール中 4=終わり */
export type State = 0 | 1 | 2 | 3 | 4;