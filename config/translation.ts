export type EngineType = 'google' | 'openai' | 'gemini' | 'claude' | 'ollama' | 'lmstudio';

export interface EngineConfig {
    enabled: boolean;
    verified: boolean;
    apiKey?: string;
    model?: string;
    apiBase?: string; // For Ollama
    temperature?: number;
}

export type PerEngineConfig = Record<EngineType, EngineConfig>;

export type TranslationConfig = {
    // Current active engine
    engine: EngineType;
    // Current active model/key (runtime selection from PerEngineConfig)
    // We keep these for backward compat / easy access, but source of truth should be in engines map
    apiKey?: string;
    model?: string;
    apiBase?: string;

    targetLang: string;
    temperature?: number;
    forceJsonMode?: boolean;

    // Detailed config for each engine
    engines: PerEngineConfig;
};

export type Variable = {
    id: string;
    key: string;
    value: string;
    type: 'text' | 'file' | 'template';
    fileName?: string;
};

export type Template = {
    id: string;
    name: string;
    prompt: string;
};

export type GlobalTranslationSettings = {
    config: TranslationConfig;
    prompt: string;
    showThinking?: boolean;
    contextFilePath: string;
    styleRef: number;

    variables: Variable[];
    savedTemplates: Template[];
    batchSize: number;
    inputFormat: 'json' | 'markdown' | 'xml' | 'custom';
    inputTemplate?: string;
};

import defaultSettings from './translation.json';

// Helper to initialize missing engines
const defaultEngineConfig: EngineConfig = { enabled: false, verified: false };

export const DEFAULT_TRANSLATION_SETTINGS: GlobalTranslationSettings = {
    ...defaultSettings,
    config: {
        ...defaultSettings.config,
        engine: defaultSettings.config.engine as any,
        targetLang: (defaultSettings.config as any).targetLang || 'zh-TW',
        apiBase: (defaultSettings.config as any).apiBase || 'http://localhost:11434',
        engines: (defaultSettings.config as any).engines || {
            google: { enabled: true, verified: true }, // Free google usually works
            openai: { ...defaultEngineConfig },
            gemini: { ...defaultEngineConfig },
            claude: { ...defaultEngineConfig },
            ollama: { enabled: false, verified: false, apiBase: 'http://localhost:11434', model: 'llama3' },
            lmstudio: { enabled: false, verified: false, apiBase: 'http://localhost:1234/v1', model: 'local-model' }
        }
    }
} as GlobalTranslationSettings;

export const STORAGE_KEY = 'translation-settings';