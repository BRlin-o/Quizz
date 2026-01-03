"use client";

import React, { useState } from 'react';
import { Save, Languages, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { addToast } from '@heroui/react';
import { GlobalTranslationSettings } from './TranslationSettings';

interface Option {
    label: string;
    text: string;
}

interface QuestionData {
    id: number | string;
    question: string;
    options: Option[];
    correct_answer: string;
    analysis: string;
    type?: string;
    source?: string;
}

interface QuestionEditorProps {
    question: QuestionData | null;
    onSave: (q: QuestionData) => void;
    onTranslate: (text: string, field: string) => Promise<string>;
    isSaving: boolean;
    settings: GlobalTranslationSettings;
    onOpenSettings: () => void;
}

export default function QuestionEditor({ question, onSave, onTranslate, isSaving, settings, onOpenSettings }: QuestionEditorProps) {
    const [formData, setFormData] = useState<QuestionData | null>(null);
    const [translatingField, setTranslatingField] = useState<string | null>(null);

    // Sync state when question changes
    React.useEffect(() => {
        setFormData(question);
    }, [question]);

    if (!question || !formData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 bg-neutral-950">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a question to start editing</p>
            </div>
        );
    }

    const handleChange = (field: keyof QuestionData, value: any) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleOptionChange = (idx: number, text: string) => {
        if (!formData) return;
        const newOptions = [...formData.options];
        newOptions[idx] = { ...newOptions[idx], text };
        handleChange('options', newOptions);
    };

    const handleFieldTranslate = async (text: string, fieldPath: string, setter: (val: string) => void) => {
        if (!text) return;
        setTranslatingField(fieldPath);
        try {
            const translated = await onTranslate(text, fieldPath);
            setter(translated);
        } catch (e) {
            console.error(e);
            addToast({
                title: "Error",
                description: "Translation failed. Check console.",
                color: "danger",
                timeout: 3000,
            });
        } finally {
            setTranslatingField(null);
        }
    };

    const handleTranslateAll = async () => {
        if (!formData) return;

        setTranslatingField('all');
        try {
            // Prepare payload for context-aware translation
            const payload = {
                question: formData.question,
                options: formData.options.map(o => ({ label: o.label, text: o.text })),
                analysis: formData.analysis,
                type: formData.type || 'multiple-choice'
            };

            const jsonString = JSON.stringify(payload, null, 2);

            // Send as 'text' to translation API
            // The system prompt (configured by user) must handle JSON input/output
            const resultString = await onTranslate(jsonString, 'all');

            // Attempt to parse response
            // Sanitize potential markdown code blocks if the LLM wraps it
            const cleanJson = resultString.replace(/```json/g, '').replace(/```/g, '').trim();
            const translatedData = JSON.parse(cleanJson);

            // Update state
            const newOptions = [...formData.options];
            if (Array.isArray(translatedData.options)) {
                translatedData.options.forEach((tOpt: any, i: number) => {
                    if (newOptions[i]) {
                        if (typeof tOpt === 'string') {
                            newOptions[i].text = tOpt;
                        } else if (typeof tOpt === 'object' && tOpt !== null) {
                            // Support multiple common key names from LLMs
                            const text = tOpt.text || tOpt.content || tOpt.value || tOpt.translated_text;
                            if (text) newOptions[i].text = text;
                        }
                    }
                });
            }

            setFormData(prev => prev ? {
                ...prev,
                question: translatedData.question || prev.question,
                options: newOptions,
                analysis: translatedData.analysis || prev.analysis
            } : null);

        } catch (e) {
            console.error("Batch translation error:", e);
            addToast({
                title: "Translation Failed",
                description: "Ensure your System Prompt instructs to return valid JSON matching the input structure.",
                color: "danger",
                timeout: 5000,
            });
        } finally {
            setTranslatingField(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-neutral-950 h-full overflow-hidden relative">
            <div className="border-b border-neutral-800 p-4 flex justify-between items-center bg-neutral-900/50 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Edit Question #{formData.id}</h2>
                    <span className="text-xs px-2 py-1 bg-neutral-800 rounded-md text-neutral-400 border border-neutral-700">
                        {formData.type || "Unknown Type"}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onOpenSettings}
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm border border-neutral-700 transition-colors"
                    >
                        <Languages className="w-4 h-4" />
                        {settings.config.engine}
                    </button>
                    <button
                        onClick={handleTranslateAll}
                        disabled={!!translatingField}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm transition-colors"
                    >
                        {translatingField === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Translate All
                    </button>
                    <div className="w-px h-6 bg-neutral-800 mx-2"></div>
                    <button
                        onClick={() => setFormData(question)}
                        className="p-2 text-neutral-400 hover:text-white transition-colors"
                        title="Reset Changes"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32">
                {/* Question Text */}
                <div className="group relative">
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-indigo-400">Question Text</label>
                        <button
                            onClick={() => handleFieldTranslate(formData.question, 'question', (val) => handleChange('question', val))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-neutral-400 hover:text-white"
                        >
                            {translatingField === 'question' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                            Translate
                        </button>
                    </div>
                    <textarea
                        value={formData.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-neutral-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all min-h-[120px] text-lg leading-relaxed shadow-inner"
                    />
                </div>

                {/* Options */}
                <div className="space-y-4">
                    <label className="text-sm font-medium text-indigo-400">Options</label>
                    <div className="grid grid-cols-1 gap-4">
                        {formData.options.map((opt, idx) => (
                            <div key={idx} className="group relative flex items-start gap-3">
                                <div className={`mt-3 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border ${formData.correct_answer === opt.label ? 'bg-green-500 text-black border-green-500' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                                    {opt.label}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        className={`w-full bg-neutral-900 border ${formData.correct_answer === opt.label ? 'border-green-500/30' : 'border-neutral-800'} rounded-xl p-3 text-neutral-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all min-h-[60px] resize-y`}
                                    />
                                    <button
                                        onClick={() => handleFieldTranslate(opt.text, `option-${idx}`, (val) => handleOptionChange(idx, val))}
                                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-neutral-800 rounded-md text-neutral-400 hover:text-white"
                                        title="Translate Option"
                                    >
                                        {translatingField === `option-${idx}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="mt-3">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={formData.correct_answer === opt.label}
                                        onChange={() => handleChange('correct_answer', opt.label)}
                                        className="w-4 h-4 accent-green-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Analysis */}
                <div className="group relative bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-indigo-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Detailed Analysis
                        </label>
                        <button
                            onClick={() => handleFieldTranslate(formData.analysis, 'analysis', (val) => handleChange('analysis', val))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-neutral-400 hover:text-white"
                        >
                            {translatingField === 'analysis' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                            Translate
                        </button>
                    </div>
                    <textarea
                        value={formData.analysis}
                        onChange={(e) => handleChange('analysis', e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-neutral-300 focus:ring-0 outline-none min-h-[150px] leading-relaxed resize-none"
                        placeholder="Enter detailed explanation..."
                    />
                </div>

                {/* Metadata (Read Only) */}
                <div className="grid grid-cols-2 gap-4 text-xs text-neutral-600 font-mono mt-8 border-t border-neutral-900 pt-8">
                    <div>Source: {formData.source || 'N/A'}</div>
                    <div className="text-right">Type: {formData.type}</div>
                </div>
            </div>
        </div>
    );
}
