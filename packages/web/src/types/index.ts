export interface IQuoteListItem {
    source: string,
    vars: string,
    fullPath: string,
    loc: any
}

export interface IQuoteInfo {
    num: number,
    using: IQuoteListItem []
}

