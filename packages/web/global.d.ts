import { Config } from '@js-analyzer/core/dist/js-analyzer-core';
declare global {
    interface Window {
        ROOT: string
        CONFIG: Config
    }
}