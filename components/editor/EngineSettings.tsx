"use client";

import React, { useState } from 'react';
import { Settings, X, Save, Cpu, Check, AlertCircle, Loader2, Play } from 'lucide-react';
import { addToast } from '@heroui/react';
import { GlobalTranslationSettings, EngineType, EngineConfig } from '@/config/translation';

interface EngineSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GlobalTranslationSettings;
    onSave: (settings: GlobalTranslationSettings) => void;
}

export default function EngineSettings({ isOpen, onClose, settings, onSave }: EngineSettingsProps) {
    const [localSettings, setLocalSettings] = React.useState<GlobalTranslationSettings>(settings);

    // Temporary state for the currently 'editing' engine config to avoid deeply nested state updates every keystroke
    // But keeping it direct is simpler for now.

    const [testingEngine, setTestingEngine] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        // Validation: Ensure the ACTIVE engine is enabled?
        const activeEngine = localSettings.config.engine;
        const activeEngineConfig = localSettings.config.engines?.[activeEngine];

        if (activeEngineConfig && !activeEngineConfig.enabled) {
            // If active engine is disabled, pick the first enabled one?
            const enabled = (Object.keys(localSettings.config.engines) as EngineType[])
                .find(e => localSettings.config.engines[e].enabled);

            if (enabled) {
                localSettings.config.engine = enabled;
            } else {
                addToast({
                    title: "Warning",
                    description: "You must enable at least one engine.",
                    color: "warning",
                    timeout: 3000,
                });
                return;
            }
        }

        // Update the top-level shortcut config keys to match the active engine's config
        // (Use the safely accessed config from above or fetch again safely)
        const safeActiveConfig = localSettings.config.engines?.[localSettings.config.engine] || {};
        localSettings.config.apiKey = safeActiveConfig.apiKey;
        localSettings.config.model = safeActiveConfig.model;
        localSettings.config.apiBase = safeActiveConfig.apiBase;

        onSave(localSettings);
        onClose();
    };

    const updateEngineConfig = (engine: EngineType, updates: Partial<EngineConfig>) => {
        setLocalSettings(prev => {
            const currentEngines = prev.config.engines || {};
            const currentEngineConfig = currentEngines[engine] || { enabled: false, verified: false };

            return {
                ...prev,
                config: {
                    ...prev.config,
                    engines: {
                        ...currentEngines,
                        [engine]: { ...currentEngineConfig, ...updates }
                    }
                }
            };
        });
    };

    const testEngine = async (engine: EngineType) => {
        setTestingEngine(engine);
        try {
            const config = localSettings.config.engines[engine];
            const res = await fetch('/api/translate/test', {
                method: 'POST',
                body: JSON.stringify({ engine, config }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.success) {
                updateEngineConfig(engine, { verified: true, enabled: true });
                // alert(`${engine} passed verification and is now enabled.`);
            } else {
                updateEngineConfig(engine, { verified: false });
                addToast({
                    title: "Test Failed",
                    description: `Test failed for ${engine}: ${data.error}`,
                    color: "danger",
                    timeout: 5000,
                });
            }
        } catch (e: any) {
            addToast({
                title: "Error",
                description: `Error testing ${engine}: ${e.message}`,
                color: "danger",
                timeout: 5000,
            });
            updateEngineConfig(engine, { verified: false });
        } finally {
            setTestingEngine(null);
        }
    };

    if (!isOpen) return null;

    const engines: EngineType[] = ['google', 'openai', 'gemini', 'claude', 'ollama', 'lmstudio'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-500" />
                        Engine Manager
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Global Settings */}
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-800">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Default Target Language</label>
                        <select
                            value={localSettings.config.targetLang || 'zh-TW'}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                config: { ...localSettings.config, targetLang: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="zh-TW">Traditional Chinese (繁體中文)</option>
                            <option value="zh-CN">Simplified Chinese (简体中文)</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Available Engines</h3>

                        {engines.map(engine => {
                            const config = localSettings.config.engines?.[engine] || { enabled: false, verified: false };
                            const isTesting = testingEngine === engine;


                            return (
                                <div key={engine} className={`border rounded-xl p-4 transition-all ${config.enabled ? 'bg-neutral-800/80 border-indigo-500/30' : 'bg-neutral-900 border-neutral-800 opacity-80 hover:opacity-100'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${config.verified ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-600'}`}></div>
                                            <h4 className="text-base font-bold text-white capitalize">{engine}</h4>
                                            {config.enabled && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">Active</span>}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => testEngine(engine)}
                                                disabled={isTesting}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded transition-colors"
                                            >
                                                {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                Test
                                            </button>

                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={config.enabled}
                                                        onChange={(e) => updateEngineConfig(engine, { enabled: e.target.checked })}
                                                        disabled={!config.verified && !config.enabled && engine !== 'google'} // Allow disabling, verify before enabling (except Google which is free)
                                                    />
                                                    <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                                </div>
                                                <span className="text-xs text-neutral-400 font-medium">Enable</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Config Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        {engine !== 'google' && (
                                            <>
                                                {/* API Base URL for local engines */}
                                                {(engine === 'ollama' || engine === 'lmstudio') && (
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-500 mb-1 uppercase">API Base URL</label>
                                                        <input
                                                            type="text"
                                                            value={config.apiBase || (engine === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434')}
                                                            onChange={(e) => updateEngineConfig(engine, { apiBase: e.target.value, verified: false })}
                                                            placeholder={engine === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434'}
                                                            className="w-full bg-black/40 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200 focus:border-indigo-500 outline-none font-mono"
                                                        />
                                                    </div>
                                                )}
                                                {/* API Key for cloud engines (optional for local) */}
                                                {engine !== 'ollama' && engine !== 'lmstudio' && (
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-500 mb-1 uppercase">API Key</label>
                                                        <input
                                                            type="password"
                                                            value={config.apiKey || ''}
                                                            onChange={(e) => updateEngineConfig(engine, { apiKey: e.target.value, verified: false })}
                                                            placeholder="sk-..."
                                                            className="w-full bg-black/40 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200 focus:border-indigo-500 outline-none font-mono"
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-[10px] text-neutral-500 mb-1 uppercase">Model</label>
                                                    <input
                                                        type="text"
                                                        value={config.model || ''}
                                                        onChange={(e) => updateEngineConfig(engine, { model: e.target.value, verified: false })}
                                                        placeholder={engine === 'ollama' ? 'llama3' : engine === 'lmstudio' ? 'local-model' : 'Default'}
                                                        className="w-full bg-black/40 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200 focus:border-indigo-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </>
                                        )}
                                        {engine === 'google' && (
                                            <div className="col-span-2 text-xs text-neutral-500 italic py-2">
                                                Google Translate (Free) requires no configuration.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        Save All Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
