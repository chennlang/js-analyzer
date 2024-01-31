export interface Position {
    column: number
    index: number
    line: number
}
export interface IQuoteListItem {
    source: string,
    vars: string,
    fullPath: string,
    loc?: {
        start: Position
        end: Position
    }
}

export interface IQuoteInfo {
    num: number,
    using: IQuoteListItem []
}

