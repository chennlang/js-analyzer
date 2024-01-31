import $ from 'jquery'
import { MaterialPackage } from '@js-analyzer/core/types/index';

// api base
const BASE_URL = import.meta.env.DEV
    ? import.meta.env.VITE_API_PROXY
    : location.origin + (import.meta.env.VITE_HAS_API_PATH_PREFIX ? location.pathname : '')

console.log('BASE_URLBASE_URL:', BASE_URL)
function loadJson (url: string, cacheKey?: string) {
    // has cache
    if (cacheKey && state[cacheKey]) {
        return Promise.resolve(state[cacheKey])
    }

    // has sync result
    if (cacheKey && promiseState[cacheKey] !== undefined) {
        return promiseState[cacheKey]
    }

    const syncResult = new Promise<any>((resolve, reject) => {
        $.getJSON(BASE_URL + url, (res: any) => {
            if (cacheKey) {
                state[cacheKey] = res
                // clear sync result
                delete promiseState[cacheKey]
            }
            resolve(res)
        }, err => reject(err))
    })

    // cache sync result
    if (cacheKey) {
        promiseState[cacheKey] = syncResult
    }

    return syncResult
}

function load (url: string) {
    return new Promise<any>((resolve, reject) => {
        $.get(BASE_URL + url, {}, (res: any) => {
            resolve(res)
        })
    })
}

function request (method: string, url: string, data: any) {
    return new Promise<any>((resolve, reject) => {
        $.ajax({
            url: BASE_URL + url,
            method,
            data: JSON.stringify(data),
            dataType: 'json',
            success: resolve,
            error: reject,
            contentType: 'application/json; charset=utf-8',
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

const promiseState: Record<string, Promise<any>> = {}

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
    if (path.startsWith(window.CONFIG.root)) {
        return loadJson(`/launch/?file=${path}`)
    } else {
        return loadJson(`/launch/?file=${window.CONFIG.root}${path}`)
    }
}

export const getFileContent = (path: string) => {
    return load(`/code/?file=${path}`)
}

export const getConfig = () => {
    return load(`/config`)
}

export const updateConfig = (config: typeof window.CONFIG) => {
    return request('put', '/config', config)
}