import { Config } from '@js-analyzer/core/types/index';
declare global {
    interface Window {
        ROOT: string
        CONFIG: Config
    }
}