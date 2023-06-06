
import { IQuoteInfo } from '@/types/index'
import { ImportDepItem } from '@js-analyzer/core/dist/js-analyzer-core';

export interface IChartExtendData  extends ImportDepItem{
    fullPath: string,
    sortPath: string,
    name: string | undefined,
    ext: string | undefined,
}

export interface IChartNode {
    id: string,
    x?: number,
    y?: number,
    name?: string,
    value: string | number,
    symbolSize: number,
    category?: number,
    itemStyle: Record<string, any>,
    label?: any,

    // not echart option， extent data
    extendData: IChartExtendData,
}

export interface IChartLink {
    source: string,
    target: string
}