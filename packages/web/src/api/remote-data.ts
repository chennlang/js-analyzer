import $ from 'jquery'
import { MaterialPackage } from '@js-analyzer/core/types/index';

// api base
const BASE_URL = import.meta.env.DEV ? import.meta.env.VITE_API_PROXY : location.origin
function loadJson (url: string, cacheKey?: string) {
    // has cache
    if (cacheKey && state['cacheState']) {
        return Promise.resolve(state['cacheState'])
    }

    return new Promise<any>((resolve, reject) => {
        $.getJSON(BASE_URL + url, (res: any) => {
            if (cacheKey) state[cacheKey] = res
            resolve(res)
        }, err => reject(err))
    })
}

function load (url: string) {
    return new Promise<any>((resolve, reject) => {
        $.get(BASE_URL + url, {}, (res: any) => {
            resolve(res)
        })
    })
}


type IState = Record<string, any>

type JsonResponse<T> = Promise<T>

const state: IState = {
    files: null,
    import: null,
    export: null,
    package: null,
    unknown: null
}

export const getFiles = () => {
    return loadJson('/data/files.json', 'files')
}

export const getImport = (): JsonResponse<MaterialPackage['import-files']> => {
    return loadJson('/data/import-files.json', 'import')
}

export const getExport = () : JsonResponse<MaterialPackage['export']> => {
    return loadJson('/data/export.json', 'export')
}

export const getPackage = (): JsonResponse<MaterialPackage['import-package']> => {
    return loadJson('/data/import-package.json', 'package')
}

export const getUnknown = (): JsonResponse<MaterialPackage['import-unknown']> => {
    return loadJson('/data/import-unknown.json', 'unknown')
}

export const getNames = () => {
    return loadJson('/data/names.json', 'names')
}

export const openEditor = (path: string) => {
    if (path.startsWith(window.ROOT)) {
        return loadJson(`/launch/?file=${path}`)
    } else {
        return loadJson(`/launch/?file=${window.ROOT}${path}`)
    }
}

export const getFileContent = (path: string) => {
    return load(`/code/?file=${path}`)
}