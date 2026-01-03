"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, X, ChevronDown, Trash2, Check, AlertTriangle } from 'lucide-react';
import { GlobalTranslationSettings, Template } from '@/config/translation';
import AdditionalDataInput from './AdditionalDataInput';

interface StandardValuesProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GlobalTranslationSettings;
    onSave: (settings: GlobalTranslationSettings) => void;
}

export default function StandardTranslationSettings({ isOpen, onClose, settings, onSave }: StandardValuesProps) {
    const [localSettings, setLocalSettings] = useState<GlobalTranslationSettings>(settings);
    const [templateName, setTemplateName] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [cleanSnapshot, setCleanSnapshot] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'prompt' | 'engine'>('prompt');

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            setCleanSnapshot(JSON.stringify({ ...settings, savedTemplates: [] }));
        }
    }, [isOpen, settings]);

    const hasUnsavedChanges = () => {
        const current = JSON.stringify({ ...localSettings, savedTemplates: [] });
        return current !== cleanSnapshot;
    };

    const handleCloseAttempt = () => {
        if (hasUnsavedChanges()) {
            setPendingAction(() => onClose);
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleSaveTemplate = () => {
        if (!templateName || !localSettings.prompt) return;
        const newTemplates = [...(localSettings.savedTemplates || [])];
        const existingIdx = newTemplates.findIndex(t => t.name === templateName);

        const newTemplate = {
            id: existingIdx >= 0 ? newTemplates[existingIdx].id : Date.now().toString(),
            name: templateName,
            prompt: localSettings.prompt
        };

        if (existingIdx >= 0) newTemplates[existingIdx] = newTemplate;
        else newTemplates.push(newTemplate);

        const updatedSettings = { ...localSettings, savedTemplates: newTemplates };
        setLocalSettings(updatedSettings);
        onSave(updatedSettings); // Persist immediately
        setSaveSuccess(true);
    };

    const loadTemplate = (t: Template) => {
        const action = () => {
            setLocalSettings(prev => ({ ...prev, prompt: t.prompt }));
            setTemplateName(t.name);
            setIsDropdownOpen(false);
        };

        if (hasUnsavedChanges()) {
            setPendingAction(() => action);
            setShowUnsavedWarning(true);
        } else {
            action();
        }
    };

    const deleteTemplate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete template?")) {
            const updatedTemplates = localSettings.savedTemplates.filter(t => t.id !== id);
            const updatedSettings = { ...localSettings, savedTemplates: updatedTemplates };
            setLocalSettings(updatedSettings);
            onSave(updatedSettings); // Persist immediately
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Translation Settings
                    </h2>
                    <button onClick={handleCloseAttempt} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-neutral-800 mb-4 space-x-4">
                    <button
                        onClick={() => setActiveTab('prompt')}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'prompt' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500'}`}
                    >
                        Prompt & Variables
                    </button>
                    <button
                        onClick={() => setActiveTab('engine')}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'engine' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500'}`}
                    >
                        Engine Config
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {activeTab === 'prompt' && (
                        <>
                            {/* Prompt Section */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-sm font-semibold text-neutral-300">System Prompt</h3>

                                    {/* Template Controls (ComboBox) */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded overflow-hidden w-64">
                                                <input
                                                    value={templateName}
                                                    onChange={(e) => setTemplateName(e.target.value)}
                                                    placeholder="Template Name..."
                                                    className="bg-transparent border-none text-xs text-neutral-200 px-3 py-1.5 flex-1 focus:ring-0 outline-none"
                                                />
                                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="px-1.5 py-1.5 hover:bg-neutral-700 text-neutral-400 border-l border-neutral-700">
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            {isDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                    {localSettings.savedTemplates?.map(t => (
                                                        <div key={t.id} onClick={() => loadTemplate(t)} className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs text-neutral-300 border-b border-neutral-800/50 flex justify-between group">
                                                            <span className="truncate">{t.name}</span>
                                                            <Trash2 onClick={(e) => deleteTemplate(e, t.id)} className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400" />
                                                        </div>
                                                    ))}
                                                    {(!localSettings.savedTemplates || localSettings.savedTemplates.length === 0) && (
                                                        <div className="p-2 text-xs text-neutral-500 text-center">No saved templates</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={!templateName}
                                            className="p-1.5 bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-400 rounded transition-colors border border-neutral-700 disabled:opacity-50"
                                            title="Save Template"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={localSettings.prompt}
                                    onChange={(e) => setLocalSettings({ ...localSettings, prompt: e.target.value })}
                                    className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono text-sm text-neutral-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </section>

                            <AdditionalDataInput
                                variables={localSettings.variables}
                                onChange={(vars) => setLocalSettings({ ...localSettings, variables: vars })}
                                targetLang={localSettings.config.targetLang}
                            />
                        </>
                    )}

                    {activeTab === 'engine' && (
                        <div className="space-y-4">
                            {/* Target Language */}
                            <div>
                                <label className="text-xs text-neutral-500">Target Language</label>
                                <select
                                    value={localSettings.config.targetLang || 'zh-TW'}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        config: { ...localSettings.config, targetLang: e.target.value }
                                    })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm mt-1"
                                >
                                    <option value="zh-TW">Traditional Chinese (繁體中文)</option>
                                    <option value="zh-CN">Simplified Chinese (简体中文)</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                                {['google', 'openai', 'gemini', 'claude', 'ollama'].map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setLocalSettings(prev => ({ ...prev, config: { ...prev.config, engine: e as any } }))}
                                        className={`p-2 border rounded text-center text-xs uppercase ${localSettings.config.engine === e ? 'bg-indigo-900 border-indigo-500 text-indigo-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>


                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end gap-3">
                    <button onClick={handleCloseAttempt} className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white">Cancel</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
                {saveSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
                            <div className="bg-green-500/20 p-3 rounded-full text-green-400">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg text-white font-bold">Template Saved!</h3>
                            <button
                                onClick={() => setSaveSuccess(false)}
                                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {showUnsavedWarning && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                    <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 max-w-sm text-center">
                        <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg text-white font-bold mb-1">Unsaved Changes</h3>
                            <p className="text-sm text-neutral-400">You have unsaved changes. Are you sure you want to discard them?</p>
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                            <button
                                onClick={() => {
                                    setShowUnsavedWarning(false);
                                    setPendingAction(null);
                                }}
                                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (pendingAction) pendingAction();
                                    setShowUnsavedWarning(false);
                                    setPendingAction(null);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
