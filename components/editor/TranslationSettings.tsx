"use client";

import React, { useEffect, useState } from 'react';
import { Settings, Save, X, FileText, Plus, Trash2, Edit2, Check, Copy, ChevronDown } from 'lucide-react';

import { DEFAULT_TRANSLATION_SETTINGS, GlobalTranslationSettings, Template, Variable } from '@/config/translation';

interface TranslationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: GlobalTranslationSettings) => void;
    initialSettings: GlobalTranslationSettings;
}

export default function TranslationSettings({ isOpen, onClose, onSave, initialSettings }: TranslationSettingsProps) {
    // Initialize with safe defaults to prevent crash on first render if initialSettings has missing fields
    const [settings, setSettings] = useState<GlobalTranslationSettings>({
        ...DEFAULT_TRANSLATION_SETTINGS,
        ...initialSettings,
        variables: initialSettings?.variables || [],
        savedTemplates: initialSettings?.savedTemplates || [],
        batchSize: initialSettings?.batchSize || 10
    });
    const [files, setFiles] = useState<string[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // UI State for Variables
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [newVarType, setNewVarType] = useState<'text' | 'file'>('text');

    // UI State for Templates
    const [templateName, setTemplateName] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Ensure compatibility and sync with props
            // Logic: If local settings (initialSettings) have empty arrays but defaults have items, likely we want defaults.
            setSettings(prev => {
                const merged = {
                    ...DEFAULT_TRANSLATION_SETTINGS,
                    ...initialSettings,
                };

                // Special handling: if savedTemplates/variables are empty in initial, use Default
                if ((!initialSettings.variables || initialSettings.variables.length === 0) && DEFAULT_TRANSLATION_SETTINGS.variables.length > 0) {
                    merged.variables = DEFAULT_TRANSLATION_SETTINGS.variables;
                }
                if ((!initialSettings.savedTemplates || initialSettings.savedTemplates.length === 0) && DEFAULT_TRANSLATION_SETTINGS.savedTemplates.length > 0) {
                    merged.savedTemplates = DEFAULT_TRANSLATION_SETTINGS.savedTemplates;
                }

                return merged;
            });
            fetchFiles();
        }
    }, [isOpen, initialSettings]);

    const fetchFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await fetch('/api/files');
            const data = await res.json();
            if (data.files) {
                setFiles(data.files);
            }
        } catch (e) {
            console.error("Failed to load files", e);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const addVariable = () => {
        if (!newVarKey) return;
        const newVar: Variable = {
            id: Date.now().toString(),
            key: newVarKey,
            value: newVarValue,
            type: newVarType,
            fileName: newVarType === 'file' ? newVarValue : undefined // store path as value
        };
        setSettings({
            ...settings,
            variables: [...settings.variables, newVar]
        });
        setNewVarKey('');
        setNewVarValue('');
    };

    const removeVariable = (id: string) => {
        setSettings({
            ...settings,
            variables: settings.variables.filter(v => v.id !== id)
        });
    };

    // UI State for Feedback
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const [activeModal, setActiveModal] = useState<{
        type: 'overwrite' | 'discard_on_close' | 'discard_on_load';
        onConfirm: () => void;
    } | null>(null);

    // Track original settings for dirty check
    const [startSettings, setStartSettings] = useState<GlobalTranslationSettings>(settings);

    // Sync startSettings when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartSettings(settings);
        }
    }, [isOpen]);
    // Note: We only set startSettings once when open. 
    // Ideally we might want to update it if the user hits "Save Settings" but that closes the modal anyway.

    const isDirty = () => {
        // Simple JSON comparison helps detect deep changes
        // We exclude savedTemplates from comparison because adding a template is a separate action
        // But if they added a template and haven't saved Global Settings, we might still warn?
        // User asked for "system prompt content modified".
        // Let's compare critical fields.
        const { savedTemplates: s1, ...rest1 } = settings;
        const { savedTemplates: s2, ...rest2 } = startSettings;
        return JSON.stringify(rest1) !== JSON.stringify(rest2);
    };

    const handleClose = () => {
        if (isDirty()) {
            setActiveModal({
                type: 'discard_on_close',
                onConfirm: onClose
            });
        } else {
            onClose();
        }
    };

    const saveTemplate = () => {
        if (!templateName || !settings.prompt) return;
        const existingIndex = settings.savedTemplates?.findIndex(t => t.name === templateName);

        if (existingIndex !== undefined && existingIndex >= 0) {
            setActiveModal({
                type: 'overwrite',
                onConfirm: performSave
            });
        } else {
            performSave();
        }
    };

    const performSave = () => {
        const existingIndex = settings.savedTemplates?.findIndex(t => t.name === templateName);
        let newTemplates = [...(settings.savedTemplates || [])];

        if (existingIndex !== undefined && existingIndex >= 0) {
            newTemplates[existingIndex] = {
                ...newTemplates[existingIndex],
                prompt: settings.prompt
            };
        } else {
            newTemplates.push({
                id: Date.now().toString(),
                name: templateName,
                prompt: settings.prompt
            });
        }

        setSettings({
            ...settings,
            savedTemplates: newTemplates
        });

        // Show success feedback
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const loadTemplate = (t: Template) => {
        const applyTemplate = () => {
            setSettings({ ...settings, prompt: t.prompt });
            setTemplateName(t.name);
            setShowDropdown(false);
            // Updating prompt makes it dirty relative to startSettings? 
            // Yes, but that's expected. We don't update startSettings here because we haven't "saved" to parent yet.
        };

        if (isDirty()) {
            setActiveModal({
                type: 'discard_on_load',
                onConfirm: applyTemplate
            });
        } else {
            applyTemplate();
        }
    };

    const deleteTemplate = (id: string) => {
        setSettings({
            ...settings,
            savedTemplates: settings.savedTemplates.filter(t => t.id !== id)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl overflow-y-auto max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Translation Settings
                    </h2>
                    <button onClick={handleClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8">

                    {/* 1. Engine & Basic Config */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Engine Configuration</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {['google', 'openai', 'gemini', 'claude', 'ollama', 'lmstudio'].map((engine) => (
                                <button
                                    key={engine}
                                    onClick={() => setSettings({ ...settings, config: { ...settings.config, engine: engine as any } })}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${settings.config.engine === engine
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-750'
                                        }`}
                                >
                                    {engine.charAt(0).toUpperCase() + engine.slice(1)}
                                </button>
                            ))}
                        </div>

                        {settings.config.engine !== 'google' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* API Base (for local engines) */}
                                {(settings.config.engine === 'ollama' || settings.config.engine === 'lmstudio') && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">API Base URL</label>
                                        <input
                                            type="text"
                                            value={settings.config.apiBase || ''}
                                            onChange={(e) => setSettings({ ...settings, config: { ...settings.config, apiBase: e.target.value } })}
                                            placeholder={settings.config.engine === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434'}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        API Key {(settings.config.engine === 'ollama' || settings.config.engine === 'lmstudio') && <span className="text-neutral-600">(optional)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={settings.config.apiKey || ''}
                                        onChange={(e) => setSettings({ ...settings, config: { ...settings.config, apiKey: e.target.value } })}
                                        placeholder={`Enter ${settings.config.engine} API key`}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Model Name</label>
                                    <input
                                        type="text"
                                        value={settings.config.model || ''}
                                        onChange={(e) => setSettings({ ...settings, config: { ...settings.config, model: e.target.value } })}
                                        placeholder={
                                            settings.config.engine === 'lmstudio' ? 'e.g. local-model, deepseek-r1...' :
                                                settings.config.engine === 'ollama' ? 'e.g. llama3, qwen2...' :
                                                    'e.g. gpt-4o, claude-3-5-sonnet...'
                                        }
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 2. Prompt & Templates */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">System Prompt</h3>
                            <div className="flex gap-2 items-center">
                                {/* ComboBox: Input + Dropdown Toggle */}
                                <div className="relative group flex items-center">
                                    <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-l-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => {
                                                setTemplateName(e.target.value);
                                            }}
                                            placeholder="Select or Name..."
                                            className="bg-transparent border-none text-xs text-white px-3 py-1.5 w-40 focus:ring-0 outline-none placeholder:text-neutral-500"
                                        />
                                        <button
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            className="px-2 py-1.5 border-l border-neutral-700 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Save Button (Joined) */}
                                    <button
                                        onClick={saveTemplate}
                                        disabled={!templateName || !settings.prompt}
                                        className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg text-xs font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${saveStatus === 'saved'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                            }`}
                                        title="Save Template"
                                    >
                                        {saveStatus === 'saved' ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3.5 h-3.5" />
                                                Save
                                            </>
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 overflow-hidden flex flex-col">
                                            {settings.savedTemplates?.length > 0 ? (
                                                <div className="max-h-60 overflow-y-auto">
                                                    {settings.savedTemplates.map(t => (
                                                        <div key={t.id} className="group flex items-center justify-between px-3 py-2 hover:bg-neutral-700 transition-colors border-b border-neutral-750 last:border-0 cursor-pointer"
                                                            onClick={() => {
                                                                setTemplateName(t.name);
                                                                loadTemplate(t);
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <span className="flex-1 text-left text-xs text-neutral-300 group-hover:text-white truncate pr-2">
                                                                {t.name}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm(`Delete template "${t.name}"?`)) {
                                                                        deleteTemplate(t.id);
                                                                        if (templateName === t.name) setTemplateName('');
                                                                    }
                                                                }}
                                                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-3 py-4 text-center text-xs text-neutral-500 italic">
                                                    No saved templates
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chips for quick access are redundant with dropdown, removing them to clean UI per request for dropdown-centric workflow. 
                            Actually, let's keep them hidden or removed. The user asked for "dropdown to select saved". 
                            I will remove the old chip list block. 
                        */}

                        <div className="relative">
                            <textarea
                                value={settings.prompt}
                                onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm h-40 outline-none"
                                placeholder="You are a professional translator..."
                            />
                            <div className="absolute right-2 bottom-2 text-xs text-neutral-500">
                                Supports {"{{variable}}"} interpolation
                            </div>
                        </div>
                    </section>

                    {/* 3. Variables / Additional Data */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Additional Data (Variables)</h3>
                        <div className="bg-neutral-800/50 rounded-lg border border-neutral-800 p-4 space-y-3">
                            {/* Add New Variable */}
                            <div className="flex gap-2 items-start">
                                <div className="flex-1 grid grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        value={newVarKey}
                                        onChange={(e) => setNewVarKey(e.target.value)}
                                        placeholder="Key (e.g. style)"
                                        className="col-span-3 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white"
                                    />
                                    <select
                                        value={newVarType}
                                        onChange={(e) => setNewVarType(e.target.value as any)}
                                        className="col-span-2 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-300"
                                    >
                                        <option value="text">Text</option>
                                        <option value="file">File</option>
                                    </select>

                                    {newVarType === 'text' ? (
                                        <input
                                            type="text"
                                            value={newVarValue}
                                            onChange={(e) => setNewVarValue(e.target.value)}
                                            placeholder="Value"
                                            className="col-span-7 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white"
                                        />
                                    ) : (
                                        <select
                                            value={newVarValue}
                                            onChange={(e) => setNewVarValue(e.target.value)}
                                            className="col-span-7 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white"
                                        >
                                            <option value="">Select File...</option>
                                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    )}
                                </div>
                                <button
                                    onClick={addVariable}
                                    disabled={!newVarKey || !newVarValue}
                                    className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* List Variables */}
                            <div className="space-y-2 mt-4">
                                {settings.variables.map(v => (
                                    <div key={v.id} className="flex items-center gap-3 bg-neutral-900 px-3 py-2 rounded border border-neutral-800 text-sm">
                                        <span className="font-mono text-indigo-400">{`{{${v.key}}}`}</span>
                                        <span className="text-neutral-600 text-xs uppercase px-1">{v.type}</span>
                                        <span className="text-neutral-300 flex-1 truncate" title={v.value}>
                                            {v.fileName || v.value}
                                        </span>
                                        <button onClick={() => removeVariable(v.id)} className="text-neutral-500 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {settings.variables.length === 0 && (
                                    <p className="text-neutral-600 text-sm italic text-center py-2">No variables added</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 4. Batch & Advanced Settings */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Batch & Advanced</h3>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-neutral-400">Batch Size</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={settings.batchSize}
                                    onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) || 10 })}
                                    className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-center"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm text-neutral-400">Style Ref Count</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={settings.styleRef ?? 3}
                                    onChange={(e) => setSettings({ ...settings, styleRef: parseInt(e.target.value) || 0 })}
                                    className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-center"
                                />
                                <span className="text-xs text-neutral-500">Ex: 3 previous examples</span>
                            </div>
                        </div>
                    </section>

                </div>

                <div className="mt-8 pt-4 border-t border-neutral-800 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Generic Confirmation Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-80 shadow-2xl transform scale-100 transition-all">
                        <h4 className="text-lg font-bold text-white mb-2">
                            {activeModal.type === 'overwrite' ? 'Overwrite Template?' : 'Unsaved Changes'}
                        </h4>
                        <p className="text-neutral-300 text-sm mb-6">
                            {activeModal.type === 'overwrite'
                                ? <>Template <span className="font-mono text-indigo-400">"{templateName}"</span> already exists. Do you want to overwrite it?</>
                                : activeModal.type === 'discard_on_close'
                                    ? "You have unsaved changes. Are you sure you want to close without saving?"
                                    : "You have unsaved changes. Switching templates will discard them."
                            }
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-3 py-1.5 rounded text-sm text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    activeModal.onConfirm();
                                    setActiveModal(null);
                                }}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors text-white ${activeModal.type === 'overwrite' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {activeModal.type === 'overwrite' ? 'Overwrite' : 'Discard & Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
