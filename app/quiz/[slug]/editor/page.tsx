"use client";

import React, { useEffect, useState } from 'react';
import QuestionList from '@/components/editor/QuestionList';
import QuestionEditor from '@/components/editor/QuestionEditor';
import EngineSettings from '@/components/editor/EngineSettings';
import BatchTranslationInterface from '@/components/editor/BatchTranslationInterface';
import StandardTranslationSettings from '@/components/editor/StandardTranslationSettings';
import { Loader2, ArrowLeft, FileJson, Cpu, Languages, Play, ArrowRightLeft, Save, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { addToast } from '@heroui/react';
import { DEFAULT_TRANSLATION_SETTINGS, GlobalTranslationSettings, STORAGE_KEY } from '@/config/translation';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function QuizEditorPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');

    // Unwrap params
    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    const [questions, setQuestions] = useState<any[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    const [currentFile, setCurrentFile] = useState<string>('questions.json');
    const [selectedId, setSelectedId] = useState<number | string | null>(null);
    const [checkedIds, setCheckedIds] = useState<(number | string)[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // File Manager State
    const [fileNameInput, setFileNameInput] = useState<string>('questions.json');
    const [isFilesOpen, setIsFilesOpen] = useState(false);

    // Settings State
    const [settings, setSettings] = useState<GlobalTranslationSettings>(DEFAULT_TRANSLATION_SETTINGS);
    const [engineSettingsOpen, setEngineSettingsOpen] = useState(false);
    const [standardSettingsOpen, setStandardSettingsOpen] = useState(false);

    // View Mode: 'editor' | 'batch'
    const [viewMode, setViewMode] = useState<'editor' | 'batch'>('editor');

    // Quick Batch State
    const [isQuickTranslating, setIsQuickTranslating] = useState(false);
    const [quickProgress, setQuickProgress] = useState(0);

    // Load quiz-specific translation config from API
    const fetchConfig = async (quizSlug: string) => {
        try {
            const res = await fetch(`/api/quiz/${quizSlug}/config`);
            const data = await res.json();
            if (data.config) {
                // Merge with defaults to ensure new fields exist
                setSettings({
                    ...DEFAULT_TRANSLATION_SETTINGS,
                    ...data.config,
                    config: {
                        ...DEFAULT_TRANSLATION_SETTINGS.config,
                        ...data.config.config,
                        engines: {
                            ...DEFAULT_TRANSLATION_SETTINGS.config.engines,
                            ...(data.config.config?.engines || {})
                        }
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load quiz config", e);
        }
    };

    useEffect(() => {
        if (slug) {
            fetchFiles();
            fetchQuestions(currentFile);
            fetchConfig(slug);
        }
    }, [slug]);

    useEffect(() => {
        if (slug && currentFile) {
            setFileNameInput(currentFile);
            fetchQuestions(currentFile);
        }
    }, [currentFile, slug]);

    const fetchFiles = async () => {
        try {
            const res = await fetch(`/api/quiz/${slug}/files`);
            const data = await res.json();
            if (data.files) {
                setFiles(data.files);
                if (!data.files.includes(currentFile) && data.files.length > 0) {
                    setCurrentFile(data.files[0]);
                }
            }
        } catch (e) {
            console.error("Failed to load files", e);
        }
    };

    const fetchQuestions = async (filename: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/questions?slug=${slug}&filename=${filename}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
                setCheckedIds([]);
            } else {
                setQuestions([]);
            }
        } catch (e) {
            console.error("Failed to fetch questions", e);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (newSettings: GlobalTranslationSettings) => {
        setSettings(newSettings);
        // Save to quiz-specific config file via API
        if (slug) {
            try {
                await fetch(`/api/quiz/${slug}/config`, {
                    method: 'POST',
                    body: JSON.stringify({ settings: newSettings }),
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.error("Failed to save quiz config", e);
            }
        }
    };

    const handleSaveQuestion = async (updatedQ: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                body: JSON.stringify({
                    slug,
                    filename: currentFile,
                    ...updatedQ
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
                console.log("Saved successfully");
            } else {
                addToast({
                    title: "Error",
                    description: "Failed to save",
                    color: "danger",
                    timeout: 3000,
                });
            }
        } catch (e) {
            console.error(e);
            addToast({
                title: "Error",
                description: "Error saving question",
                color: "danger",
                timeout: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    // Save current questions to a file (Bulk Save / Save As)
    const handleSaveFile = async () => {
        if (!fileNameInput) return;

        // Confirm overwrite only if saving to a different, exciting file
        if (fileNameInput !== currentFile && files.includes(fileNameInput)) {
            if (!confirm(`Overwrite existing file "${fileNameInput}"?`)) return;
        }

        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                body: JSON.stringify({
                    slug,
                    filename: fileNameInput,
                    questions // Save all current questions
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                addToast({
                    title: "Success",
                    description: "File saved successfully.",
                    color: "success",
                    timeout: 3000,
                });
                fetchFiles();
                if (fileNameInput !== currentFile) {
                    setCurrentFile(fileNameInput);
                }
            } else {
                addToast({
                    title: "Error",
                    description: "Failed to save file.",
                    color: "danger",
                    timeout: 3000,
                });
            }
        } catch (e) {
            console.error(e);
            addToast({
                title: "Error",
                description: "Error saving file",
                color: "danger",
                timeout: 3000,
            });
        }
    };

    // Helper to resolve variables (Text or File content)
    const resolveVariables = async () => {
        const resolved: Record<string, string> = {};
        for (const v of settings.variables) {
            if (v.type === 'file' && v.value) {
                try {
                    const res = await fetch(`/api/files?path=${encodeURIComponent(v.value)}`);
                    const data = await res.json();
                    resolved[v.key] = data.content || '';
                } catch (e) {
                    console.error(`Failed to resolve file variable ${v.key}`, e);
                    resolved[v.key] = '';
                }
            } else {
                resolved[v.key] = v.value || '';
            }
        }
        return resolved;
    };

    // Single Translation (used by Editor Component)
    const handleTranslate = async (text: string): Promise<string> => {
        try {
            const variablesMap = await resolveVariables();

            // Client-side interpolation
            let finalPrompt = settings.prompt || "";
            const targetLang = settings.config.targetLang || 'zh-TW';

            // Replace variables
            Object.entries(variablesMap).forEach(([key, val]) => {
                finalPrompt = finalPrompt.split(`{{${key}}}`).join(val);
            });

            // Replace TARGET_LANGUAGE
            finalPrompt = finalPrompt.replace(/{{TARGET_LANGUAGE}}/g, targetLang);

            const res = await fetch('/api/translate', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    targetLang,
                    engine: settings.config.engine,
                    config: settings.config,
                    prompt: finalPrompt,
                    variables: {} // Variables processed on client
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data.translatedText;
        } catch (e) {
            console.error("Translation error", e);
            throw e;
        }
    };

    // Quick Batch Translation (Direct from Header)
    const handleQuickTranslate = async () => {
        if (!checkedIds.length) return;
        if (!confirm(`Quick translate ${checkedIds.length} items using current settings? For more control, use 'Batch Interface'.`)) return;

        setIsQuickTranslating(true);
        setQuickProgress(0);

        try {
            const batchSize = settings.batchSize || 10;
            const selectedQs = questions.filter(q => checkedIds.includes(q.id));

            // Resolve variables (Text or File Content)
            const variablesMap = await resolveVariables();

            // Client-side interpolation
            let finalPrompt = settings.prompt || "";
            const targetLang = settings.config.targetLang || 'zh-TW';

            Object.entries(variablesMap).forEach(([key, val]) => {
                finalPrompt = finalPrompt.split(`{{${key}}}`).join(val);
            });
            finalPrompt = finalPrompt.replace(/{{TARGET_LANGUAGE}}/g, targetLang);

            // Chunk questions
            for (let i = 0; i < selectedQs.length; i += batchSize) {
                const chunk = selectedQs.slice(i, i + batchSize);
                const payload = JSON.stringify(chunk.map(q => ({ id: q.id, question: q.question, type: q.type })));

                try {
                    const res = await fetch('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({
                            text: payload,
                            targetLang,
                            engine: settings.config.engine,
                            config: settings.config,
                            prompt: finalPrompt,
                            variables: {}
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await res.json();
                    if (!data.error) {
                        const cleanJson = data.translatedText.replace(/```json/g, '').replace(/```/g, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        if (Array.isArray(parsed)) {
                            setQuestions(prev => prev.map(q => {
                                const update = parsed.find((p: any) => String(p.id) === String(q.id));
                                return update ? { ...q, ...update } : q;
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Quick batch chunk failed", e);
                }
                setQuickProgress(Math.round(((i + chunk.length) / selectedQs.length) * 100));
            }
            setCheckedIds([]);
            addToast({
                title: "Success",
                description: "Quick translation complete.",
                color: "success",
                timeout: 3000,
            });

        } catch (e) {
            console.error(e);
            addToast({
                title: "Error",
                description: "Quick translation failed",
                color: "danger",
                timeout: 3000,
            });
        } finally {
            setIsQuickTranslating(false);
            setQuickProgress(0);
        }
    };

    // Callback from Batch Interface
    const handleBatchUpdate = (updatedQuestions: any[]) => {
        setQuestions(updatedQuestions);
    };

    const handleToggleCheck = (id: number | string) => {
        setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleToggleAll = () => {
        const filteredParam = searchTerm.toLowerCase();
        const visibleIds = questions
            .filter(q => !searchTerm || q.question?.toLowerCase().includes(filteredParam) || String(q.id).includes(filteredParam))
            .map(q => q.id);

        if (checkedIds.length === visibleIds.length && visibleIds.length > 0) {
            setCheckedIds([]);
        } else {
            setCheckedIds(visibleIds);
        }
    };

    const selectedQuestion = questions.find(q => q.id === selectedId) || null;

    if (!slug) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
            {/* Top Header */}
            <div className="h-14 border-b border-neutral-800 flex items-center px-4 bg-neutral-900/80 backdrop-blur z-20 justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/quiz/${slug}`} className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Quiz
                    </Link>
                    <div className="h-4 w-px bg-neutral-700"></div>
                    <h1 className="font-bold text-sm tracking-wide text-neutral-200">
                        Editor: <span className="text-indigo-400">{slug}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">

                    {/* Quick Translate Action (Only show in Editor Mode) */}
                    {viewMode === 'editor' && checkedIds.length > 0 && (
                        <button
                            onClick={handleQuickTranslate}
                            disabled={isQuickTranslating}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 mr-2"
                        >
                            {isQuickTranslating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5" />
                            )}
                            {isQuickTranslating ? `${quickProgress}%` : `Translate ${checkedIds.length} Items`}
                        </button>
                    )}

                    {/* Helper Buttons */}
                    <button
                        onClick={() => setEngineSettingsOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300 rounded text-xs font-medium transition-all"
                    >
                        <Cpu className="w-3.5 h-3.5" />
                        Engines
                    </button>

                    {/* Toggle View Button */}
                    <button
                        onClick={() => setViewMode(prev => prev === 'editor' ? 'batch' : 'editor')}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-bold transition-all ${viewMode === 'batch'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-indigo-600/20 hover:text-white'
                            : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            }`}
                    >
                        {viewMode === 'batch' ? <ArrowLeft className="w-3.5 h-3.5" /> : <Languages className="w-3.5 h-3.5" />}
                        {viewMode === 'batch' ? 'Back to Editor' : 'Batch & Translate'}
                    </button>

                    <div className="h-4 w-px bg-neutral-700 mx-1"></div>

                    {/* File Selector */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded overflow-hidden">
                                <div className="pl-2 pr-1">
                                    <FileJson className="w-4 h-4 text-neutral-500" />
                                </div>
                                <input
                                    value={fileNameInput}
                                    onChange={(e) => setFileNameInput(e.target.value)}
                                    className="bg-transparent border-none text-sm text-neutral-200 w-32 px-1 py-1 focus:ring-0 outline-none"
                                    placeholder="Filename..."
                                />
                                <button onClick={() => setIsFilesOpen(!isFilesOpen)} className="px-1 py-1 hover:bg-neutral-700 text-neutral-400 border-l border-neutral-700">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {isFilesOpen && (
                                <div className="absolute top-full right-0 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {files.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => {
                                                setCurrentFile(f);
                                                setIsFilesOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 border-b border-neutral-800/50 block truncate"
                                        >
                                            {f}
                                        </button>
                                    ))}
                                    {files.length === 0 && <div className="p-2 text-xs text-neutral-500 text-center">No files</div>}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSaveFile}
                            title="Save / Overwrite File"
                            className="p-1.5 bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-400 rounded transition-colors border border-neutral-700"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {viewMode === 'editor' ? (
                    <>
                        <QuestionList
                            questions={questions}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            checkedIds={checkedIds}
                            onToggleCheck={handleToggleCheck}
                            onToggleAll={handleToggleAll}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />

                        <div className="flex-1 flex flex-col relative w-full h-full">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : null}

                            <QuestionEditor
                                question={selectedQuestion}
                                onSave={handleSaveQuestion}
                                onTranslate={handleTranslate}
                                isSaving={saving}
                                settings={settings}
                                onOpenSettings={() => setStandardSettingsOpen(true)}
                            />
                        </div>
                    </>
                ) : (
                    // In Batch Mode, we render the interface inline
                    <div className="w-full h-full relative">
                        <BatchTranslationInterface
                            isOpen={true} // Always open when mounted in this view
                            onClose={() => setViewMode('editor')}
                            questions={questions}
                            initialCheckedIds={checkedIds}
                            settings={settings}
                            onSaveSettings={handleSaveSettings}
                            onUpdateQuestions={handleBatchUpdate}
                            inline={true} // Hint to disable fixed/modal positioning if component supports it (we'll modify it next)
                        />
                    </div>
                )}
            </div>

            {/* Modals always available */}
            <EngineSettings
                isOpen={engineSettingsOpen}
                onClose={() => setEngineSettingsOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
            />

            <StandardTranslationSettings
                isOpen={standardSettingsOpen}
                onClose={() => setStandardSettingsOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
            />
        </div>
    );
}
