"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RotateCw, CheckCircle2, Terminal, Search, ChevronDown, CheckSquare, Square, PanelRightOpen, PanelRightClose, ChevronLeft, ChevronRight, ArrowLeftRight, FileInput, FileOutput } from 'lucide-react';
import { addToast } from '@heroui/react';
import { GlobalTranslationSettings, Template } from '@/config/translation';
import AdditionalDataInput from './AdditionalDataInput';

interface BatchInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    questions: any[];
    initialCheckedIds: (number | string)[]; // Ids selected from editor
    settings: GlobalTranslationSettings;
    onSaveSettings: (settings: GlobalTranslationSettings) => void;
    onUpdateQuestions: (updatedQuestions: any[]) => void; // Callback when translation finishes
    inline?: boolean;
}

type Tab = 'logs' | 'results';

export default function BatchTranslationInterface({
    isOpen,
    onClose,
    questions,
    initialCheckedIds,
    settings,
    onSaveSettings,
    onUpdateQuestions,
    inline = false
}: BatchInterfaceProps) {
    if (!isOpen) return null;

    // --- State: Selection ---
    const [localCheckedIds, setLocalCheckedIds] = useState<(number | string)[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalCheckedIds(initialCheckedIds);
        }
    }, [isOpen, initialCheckedIds]);

    // --- State: Job Settings ---
    const [jobSettings, setJobSettings] = useState<GlobalTranslationSettings>(settings);
    const [templateName, setTemplateName] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Sync when global settings change (only on open, usually)
    useEffect(() => {
        if (isOpen) setJobSettings(settings);
    }, [isOpen, settings]);

    // Auto-save jobSettings when they change (debounced)
    useEffect(() => {
        // Skip initial mount and when panel is closed
        if (!isOpen) return;

        const timer = setTimeout(() => {
            onSaveSettings(jobSettings);
        }, 500); // Debounce 500ms

        return () => clearTimeout(timer);
    }, [jobSettings, isOpen]);

    // --- State: Execution ---
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<{ id: string | number; original: string; translated: string }[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('logs');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewTab, setPreviewTab] = useState<'input' | 'output' | 'diff'>('input');
    const [batchOutputs, setBatchOutputs] = useState<Record<number, string>>({});  // page -> raw output
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, activeTab]);

    // --- Handlers: Selection ---
    const toggleCheck = (id: number | string) => {
        setLocalCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        const visibleIds = filteredQuestions.map(q => q.id);
        const allChecked = visibleIds.every(id => localCheckedIds.includes(id));
        if (allChecked) {
            setLocalCheckedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setLocalCheckedIds(prev => [...new Set([...prev, ...visibleIds])]);
        }
    };

    const filteredQuestions = questions.filter(q =>
        !searchTerm ||
        String(q.id).includes(searchTerm) ||
        q.question?.toLowerCase().includes(searchTerm)
    );

    // --- Handlers: Settings ---
    const handleSaveTemplate = () => {
        if (!templateName || !jobSettings.prompt) return;
        const newTemplates = [...(jobSettings.savedTemplates || [])];
        const existingIdx = newTemplates.findIndex(t => t.name === templateName);

        const newTemplate = {
            id: existingIdx >= 0 ? newTemplates[existingIdx].id : Date.now().toString(),
            name: templateName,
            prompt: jobSettings.prompt
        };

        if (existingIdx >= 0) newTemplates[existingIdx] = newTemplate;
        else newTemplates.push(newTemplate);

        const newSettings = { ...jobSettings, savedTemplates: newTemplates };
        setJobSettings(newSettings);
        onSaveSettings(newSettings); // Propagate to global
        addLog(`Template "${templateName}" saved.`);
    };

    const loadTemplate = (t: Template) => {
        setJobSettings(prev => ({ ...prev, prompt: t.prompt }));
        setTemplateName(t.name);
        setIsDropdownOpen(false);
        addLog(`Template "${t.name}" loaded.`);
    };

    // --- Handlers: Execution ---
    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const runBatch = async () => {
        if (localCheckedIds.length === 0) {
            addToast({
                title: "Warning",
                description: "No questions selected!",
                color: "warning",
                timeout: 3000,
            });
            return;
        }

        setIsRunning(true);
        setActiveTab('logs');
        setLogs([]);
        setResults([]);
        setBatchOutputs({});
        setProgress(0);
        addLog(`Starting batch job for ${localCheckedIds.length} questions...`);
        addLog(`Engine: ${jobSettings.config.engine} | Batch Size: ${jobSettings.batchSize || 10}`);

        const batchSize = jobSettings.batchSize || 10;
        const selectedQs = questions.filter(q => localCheckedIds.includes(q.id));
        const totalBatches = Math.ceil(selectedQs.length / batchSize);
        let completed = 0;
        let allUpdatedQuestions = [...questions];

        try {
            // === STEP 1: Resolve all variables (including file-type) ===
            addLog("Resolving variables...");
            const resolvedVariables: Record<string, string> = {};

            for (const v of jobSettings.variables) {
                if (v.type === 'file' && v.value) {
                    try {
                        const res = await fetch(`/api/files?path=${encodeURIComponent(v.value)}`);
                        const data = await res.json();
                        resolvedVariables[v.key] = data.content || '';
                        addLog(`  ✓ Loaded file variable: {{${v.key}}}`);
                    } catch (e) {
                        addLog(`  ✗ Failed to load file: ${v.value}`);
                        resolvedVariables[v.key] = '';
                    }
                } else {
                    resolvedVariables[v.key] = v.value || '';
                }
            }

            // Add TARGET_LANGUAGE to variables
            const targetLang = jobSettings.config.targetLang || 'zh-TW';
            resolvedVariables['TARGET_LANGUAGE'] = targetLang;

            // === STEP 2: Process each batch ===
            for (let i = 0; i < selectedQs.length; i += batchSize) {
                const batchNum = Math.floor(i / batchSize) + 1;
                const chunk = selectedQs.slice(i, i + batchSize);

                // --- STYLE REF INJECTION (from previous results) ---
                const styleRefCount = jobSettings.styleRef || 0;
                let styleRefContent = "";

                if (styleRefCount > 0 && results.length > 0) {
                    const examples = results.slice(-styleRefCount);
                    if (examples.length > 0) {
                        styleRefContent = "Style References (Follow this translation style):\n" +
                            examples.map(ex => JSON.stringify({
                                original: ex.original,
                                translated: ex.translated
                            })).join("\n");
                        addLog(`  Injecting ${examples.length} style references`);
                    }
                }

                // Merge STYLE_REF into variables for this batch
                const batchVariables = { ...resolvedVariables, "STYLE_REF": styleRefContent };

                // === STEP 3: Prepare User Input (payload based on input format) ===
                // Include full question data: id, question, type, options, answer, analysis
                let userInput = "";
                const format = jobSettings.inputFormat || 'json';

                if (format === 'json') {
                    userInput = JSON.stringify(chunk.map(q => ({
                        id: q.id,
                        question: q.question,
                        type: q.type,
                        options: q.options || [],
                        answer: q.answer,
                        analysis: q.analysis
                    })), null, 2);
                } else if (format === 'markdown') {
                    userInput = chunk.map(q => {
                        let md = `## Question ${q.id}\n${q.question}`;
                        if (q.options?.length) {
                            md += '\n\n**Options:**\n' + q.options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n');
                        }
                        if (q.answer) md += `\n\n**Answer:** ${q.answer}`;
                        return md;
                    }).join("\n\n---\n\n");
                } else if (format === 'xml') {
                    userInput = chunk.map(q => {
                        let xml = `<item id="${q.id}">\n  <question>${q.question}</question>`;
                        if (q.options?.length) {
                            xml += '\n  <options>\n' + q.options.map((o: string) => `    <option>${o}</option>`).join('\n') + '\n  </options>';
                        }
                        return xml + '\n</item>';
                    }).join("\n");
                } else if (format === 'custom') {
                    const tpl = jobSettings.inputTemplate || '{{question}}';
                    userInput = chunk.map(q => tpl
                        .replace(/{{id}}/g, String(q.id))
                        .replace(/{{question}}/g, q.question)
                        .replace(/{{type}}/g, q.type || '')
                        .replace(/{{options}}/g, JSON.stringify(q.options || []))
                    ).join("\n");
                }

                // === STEP 4: Interpolate system prompt with all variables ===
                let systemPrompt = jobSettings.prompt || "";

                // Replace all variables in system prompt
                Object.entries(batchVariables).forEach(([key, val]) => {
                    systemPrompt = systemPrompt.split(`{{${key}}}`).join(val);
                });

                addLog(`Processing batch ${batchNum}/${totalBatches} (${chunk.length} items)...`);

                // === STEP 5: Call API ===
                try {
                    const res = await fetch('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({
                            // For Google Translate, we need targetLang
                            targetLang: targetLang,
                            engine: jobSettings.config.engine,
                            config: jobSettings.config,
                            // Fully prepared prompt and input
                            prompt: systemPrompt,
                            text: userInput,
                            // Variables already interpolated, but pass for potential server-side override
                            variables: {}
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const data = await res.json();
                    if (data.error) throw new Error(data.error);

                    // === STEP 6: Parse result ===
                    let translatedText = data.translatedText || "";

                    // Clean markdown code blocks if present
                    translatedText = translatedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

                    // Store raw output for preview comparison
                    setBatchOutputs(prev => ({ ...prev, [batchNum]: translatedText }));

                    try {
                        const parsed = JSON.parse(translatedText);

                        if (Array.isArray(parsed)) {
                            addLog(`  ✓ Batch ${batchNum} success: ${parsed.length} items returned`);

                            parsed.forEach((p: any) => {
                                const originalQ = chunk.find(c => String(c.id) === String(p.id));
                                if (originalQ) {
                                    // Add to results for display and style ref
                                    setResults(prev => [...prev, {
                                        id: p.id,
                                        original: originalQ.question,
                                        translated: p.question || "(No question text)"
                                    }]);

                                    // Update in full list
                                    const idx = allUpdatedQuestions.findIndex(q => String(q.id) === String(p.id));
                                    if (idx !== -1) {
                                        allUpdatedQuestions[idx] = { ...allUpdatedQuestions[idx], ...p };
                                    }
                                }
                            });
                        } else if (typeof parsed === 'object') {
                            // Single object response
                            addLog(`  ⚠ Batch ${batchNum}: Received object instead of array`);
                        }
                    } catch (parseErr) {
                        // Non-JSON response (might be plain text for single item)
                        addLog(`  ⚠ Batch ${batchNum}: Non-JSON response, storing raw text`);
                        if (chunk.length === 1) {
                            const originalQ = chunk[0];
                            setResults(prev => [...prev, {
                                id: originalQ.id,
                                original: originalQ.question,
                                translated: translatedText
                            }]);
                        }
                    }

                } catch (e: any) {
                    addLog(`  ✗ Batch ${batchNum} error: ${e.message}`);
                }

                completed += chunk.length;
                setProgress(Math.round((completed / selectedQs.length) * 100));
            }

            // === STEP 7: Complete ===
            addLog("─".repeat(40));
            addLog(`Batch translation complete. ${completed}/${selectedQs.length} items processed.`);
            onUpdateQuestions(allUpdatedQuestions);

            addToast({
                title: "Batch Complete",
                description: `Translated ${completed} questions successfully.`,
                color: "success",
                timeout: 5000,
            });

        } catch (e: any) {
            addLog(`Critical Job Error: ${e.message}`);
            addToast({
                title: "Error",
                description: e.message,
                color: "danger",
                timeout: 5000,
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className={`${inline ? 'w-full h-full relative' : 'fixed inset-0 z-50'} bg-black text-white flex flex-col`}>
            {/* Header - Conditionally hide if controlled by parent, but we need the 'Run' button. 
                If inline, maybe we want a different header? 
                The user wants "toggle view", so the parent header is visible. 
                Parent header has "Back to Editor" and "Engines". 
                We need "Run Job" inside here. 
            */}
            <header className="h-14 flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900/50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                        <RotateCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold">Job Configuration</h1>
                        <p className="text-[10px] text-neutral-400">
                            {localCheckedIds.length} items selected · Engine: <span className="text-indigo-400 uppercase">{jobSettings.config.engine}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Engine Selector - Only shows active engines */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 uppercase">Engine:</span>
                        <select
                            value={jobSettings.config.engine}
                            onChange={(e) => setJobSettings(prev => ({
                                ...prev,
                                config: { ...prev.config, engine: e.target.value as any }
                            }))}
                            disabled={isRunning}
                            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none capitalize disabled:opacity-50"
                        >
                            {Object.entries(jobSettings.config.engines || {})
                                .filter(([_, cfg]) => cfg.enabled)
                                .map(([engine]) => (
                                    <option key={engine} value={engine} className="capitalize">
                                        {engine.charAt(0).toUpperCase() + engine.slice(1)}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                    <button
                        onClick={runBatch}
                        disabled={isRunning || localCheckedIds.length === 0}
                        className="flex items-center gap-2 px-6 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded text-sm font-bold transition-all"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {isRunning ? 'Running...' : 'Run Job'}
                    </button>
                    {!inline && (
                        <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content (3-Pane Layout) */}
            <div className="flex-1 flex overflow-hidden">

                {/* 1. Left Panel: Question Selector */}
                <div className="w-72 border-r border-neutral-800 bg-neutral-900/30 flex flex-col">
                    <div className="p-3 border-b border-neutral-800 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search IDs..."
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1">
                            <span>{filteredQuestions.length} matches</span>
                            <button onClick={toggleAll} className="hover:text-white transition-colors">
                                {localCheckedIds.length > 0 && localCheckedIds.length === filteredQuestions.length ? 'None' : 'All'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredQuestions.map(q => {
                            const isChecked = localCheckedIds.includes(q.id);
                            return (
                                <div
                                    key={q.id}
                                    onClick={() => toggleCheck(q.id)}
                                    className={`group flex items-start gap-3 p-3 border-b border-neutral-800/50 cursor-pointer hover:bg-neutral-800 transition-colors ${isChecked ? 'bg-indigo-900/10' : ''}`}
                                >
                                    <div className={`mt-0.5 ${isChecked ? 'text-indigo-400' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                                        {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-[10px] text-indigo-400">#{q.id}</span>
                                            <span className="text-[9px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-400 uppercase">{q.type}</span>
                                        </div>
                                        <p className="text-[11px] text-neutral-300 line-clamp-2">{q.question}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2, 3, 4. Right Area (Split into Settings + Preview + Console) */}
                <div className="flex-1 flex flex-col min-w-0 bg-neutral-900/10">

                    {/* Top: Horizontal Split - Settings + Preview */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* Left: Job Configuration */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-6">

                                {/* Templates & Prompt */}
                                <section className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">System Settings</h3>

                                        {/* Template Selector */}
                                        <div className="relative">
                                            <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg p-0.5">
                                                <input
                                                    className="bg-transparent border-none text-xs text-white px-3 py-1.5 w-48 focus:ring-0 outline-none"
                                                    placeholder="Template Name..."
                                                    value={templateName}
                                                    onChange={(e) => setTemplateName(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 border-l border-neutral-700"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={handleSaveTemplate}
                                                    disabled={!templateName}
                                                    className="ml-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded shadow-sm disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                            </div>

                                            {isDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                    {jobSettings.savedTemplates?.length > 0 ? (
                                                        jobSettings.savedTemplates.map(t => (
                                                            <div
                                                                key={t.id}
                                                                onClick={() => loadTemplate(t)}
                                                                className="px-4 py-2 hover:bg-neutral-700 cursor-pointer text-xs text-neutral-300 border-b border-neutral-750 last:border-0"
                                                            >
                                                                {t.name}
                                                            </div>
                                                        ))
                                                    ) : <div className="p-3 text-xs text-neutral-500 italic">No saved templates</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <textarea
                                        value={jobSettings.prompt}
                                        onChange={(e) => setJobSettings({ ...jobSettings, prompt: e.target.value })}
                                        className="w-full h-40 bg-neutral-800 border border-neutral-700 rounded-xl p-4 font-mono text-xs text-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Enter system prompt here..."
                                    />
                                </section>

                                {/* Variables & Batch Size */}
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                                    <AdditionalDataInput
                                        variables={jobSettings.variables}
                                        onChange={(vars) => setJobSettings({ ...jobSettings, variables: vars })}
                                        targetLang={jobSettings.config.targetLang}
                                    />

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Input Configuration</h3>
                                        <div className="bg-neutral-800/50 rounded-lg border border-neutral-800 p-4 space-y-4">
                                            {/* Format Selection */}
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs text-neutral-400">Input Format</label>
                                                <select
                                                    value={jobSettings.inputFormat || 'json'}
                                                    onChange={(e) => setJobSettings({ ...jobSettings, inputFormat: e.target.value as any })}
                                                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="json">JSON (Default)</option>
                                                    <option value="markdown">Markdown</option>
                                                    <option value="xml">XML</option>
                                                    <option value="custom">Custom Template</option>
                                                </select>
                                            </div>

                                            {/* Custom Template Editor */}
                                            {jobSettings.inputFormat === 'custom' && (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-neutral-500">Custom Template (variables: {'{{id}}, {{question}}, {{type}}'})</label>
                                                    <textarea
                                                        value={jobSettings.inputTemplate || ''}
                                                        onChange={(e) => setJobSettings({ ...jobSettings, inputTemplate: e.target.value })}
                                                        className="w-full h-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs font-mono text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                                        placeholder="Example: Q: {{question}}"
                                                    />
                                                </div>
                                            )}



                                            {/* Execution Parameters (Nested) */}
                                            <div className="space-y-4 pt-4 border-t border-neutral-700/50">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs text-neutral-400">Batch Size</label>
                                                    <input
                                                        type="number"
                                                        min={1} max={50}
                                                        value={jobSettings.batchSize}
                                                        onChange={(e) => setJobSettings({ ...jobSettings, batchSize: parseInt(e.target.value) || 10 })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded w-16 px-2 py-1 text-xs text-center text-white"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs text-neutral-400">Style Reference Count</label>
                                                    <input
                                                        type="number"
                                                        min={0} max={10}
                                                        value={jobSettings.styleRef ?? 3}
                                                        onChange={(e) => setJobSettings({ ...jobSettings, styleRef: parseInt(e.target.value) || 0 })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded w-16 px-2 py-1 text-xs text-center text-white"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-neutral-700/50">
                                                    <div className="flex flex-col">
                                                        <label className="text-xs text-neutral-300 font-medium">Force JSON Response</label>
                                                        <span className="text-[10px] text-neutral-500">Enforce JSON format (where supported)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setJobSettings(prev => ({
                                                            ...prev,
                                                            config: { ...prev.config, forceJsonMode: !prev.config.forceJsonMode }
                                                        }))}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${jobSettings.config.forceJsonMode ? 'bg-indigo-600' : 'bg-neutral-700'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${jobSettings.config.forceJsonMode ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: jobSettings.config.forceJsonMode ? 'translateX(18px)' : 'translateX(2px)' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Collapsible Preview Panel with Tabs */}
                        <div className={`border-l border-neutral-800 bg-neutral-950 flex flex-col transition-all duration-300 ${isPreviewOpen ? 'w-[450px]' : 'w-12'}`}>
                            {/* Header */}
                            <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
                                {isPreviewOpen ? (
                                    <>
                                        <div className="flex items-center gap-1">
                                            {/* Tab Buttons */}
                                            <button
                                                onClick={() => setPreviewTab('input')}
                                                className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors flex items-center gap-1 ${previewTab === 'input' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
                                            >
                                                <FileInput className="w-3 h-3" /> Input
                                            </button>
                                            <button
                                                onClick={() => setPreviewTab('output')}
                                                className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors flex items-center gap-1 ${previewTab === 'output' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
                                            >
                                                <FileOutput className="w-3 h-3" /> Output
                                            </button>
                                            <button
                                                onClick={() => setPreviewTab('diff')}
                                                className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors flex items-center gap-1 ${previewTab === 'diff' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
                                            >
                                                <ArrowLeftRight className="w-3 h-3" /> Diff
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setIsPreviewOpen(false)}
                                            className="p-1.5 hover:bg-neutral-800 rounded transition-colors text-neutral-500 hover:text-neutral-300"
                                            title="Collapse preview"
                                        >
                                            <PanelRightClose className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="p-1.5 hover:bg-neutral-800 rounded transition-colors text-neutral-500 hover:text-neutral-300 mx-auto"
                                        title="Expand preview"
                                    >
                                        <PanelRightOpen className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            {isPreviewOpen ? (() => {
                                const batchSize = jobSettings.batchSize || 10;
                                const selectedQs = questions.filter(q => localCheckedIds.includes(q.id));
                                const totalPages = Math.ceil(selectedQs.length / batchSize) || 1;
                                const currentPage = Math.min(previewPage, totalPages);
                                const startIdx = (currentPage - 1) * batchSize;
                                const previewQs = selectedQs.slice(startIdx, startIdx + batchSize);

                                // Generate input content (with full data including options)
                                const generateInputContent = () => {
                                    const format = jobSettings.inputFormat || 'json';
                                    if (format === 'json') {
                                        // Include full question data: id, question, type, options, answer, analysis
                                        return JSON.stringify(previewQs.map(q => ({
                                            id: q.id,
                                            question: q.question,
                                            type: q.type,
                                            options: q.options || [],
                                            answer: q.answer,
                                            analysis: q.analysis
                                        })), null, 2);
                                    }
                                    if (format === 'markdown') {
                                        return previewQs.map(q => {
                                            let md = `## Question ${q.id}\n${q.question}`;
                                            if (q.options?.length) {
                                                md += '\n\n**Options:**\n' + q.options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n');
                                            }
                                            if (q.answer) md += `\n\n**Answer:** ${q.answer}`;
                                            return md;
                                        }).join('\n\n---\n\n');
                                    }
                                    if (format === 'xml') {
                                        return previewQs.map(q => {
                                            let xml = `<item id="${q.id}">\n  <question>${q.question}</question>`;
                                            if (q.options?.length) {
                                                xml += '\n  <options>\n' + q.options.map((o: string) => `    <option>${o}</option>`).join('\n') + '\n  </options>';
                                            }
                                            return xml + '\n</item>';
                                        }).join('\n');
                                    }
                                    if (format === 'custom') {
                                        const tpl = jobSettings.inputTemplate || '{{question}}';
                                        return previewQs.map(q => tpl
                                            .replace(/{{id}}/g, String(q.id))
                                            .replace(/{{question}}/g, q.question)
                                            .replace(/{{type}}/g, q.type || '')
                                            .replace(/{{options}}/g, JSON.stringify(q.options || []))
                                        ).join('\n');
                                    }
                                    return '';
                                };

                                const outputContent = batchOutputs[currentPage] || '';

                                return (
                                    <>
                                        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                                            {previewTab === 'input' && (
                                                localCheckedIds.length > 0 ? (
                                                    <pre className="text-neutral-300">{generateInputContent()}</pre>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm h-full">
                                                        Select questions to preview
                                                    </div>
                                                )
                                            )}
                                            {previewTab === 'output' && (
                                                outputContent ? (
                                                    <pre className="text-green-400">{outputContent}</pre>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm h-full">
                                                        Run a batch to see output
                                                    </div>
                                                )
                                            )}
                                            {previewTab === 'diff' && (
                                                <div className="space-y-4">
                                                    {outputContent ? (() => {
                                                        try {
                                                            const outputParsed = JSON.parse(outputContent);
                                                            const outputItems = Array.isArray(outputParsed) ? outputParsed : [outputParsed];

                                                            return previewQs.map(inputQ => {
                                                                const outputQ = outputItems.find((o: any) => String(o.id) === String(inputQ.id));
                                                                if (!outputQ) return null;

                                                                return (
                                                                    <div key={inputQ.id} className="border border-neutral-800 rounded-lg overflow-hidden">
                                                                        <div className="bg-neutral-800/50 px-3 py-1.5 text-[10px] font-bold text-neutral-400">
                                                                            #{inputQ.id} - {inputQ.type}
                                                                        </div>
                                                                        {/* Question Diff */}
                                                                        <div className="p-3 space-y-2">
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <div className="text-[9px] text-neutral-500 uppercase mb-1">Original</div>
                                                                                    <div className="text-neutral-400 text-[11px] leading-relaxed">{inputQ.question}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-[9px] text-green-500 uppercase mb-1">Translated</div>
                                                                                    <div className="text-green-400 text-[11px] leading-relaxed">{outputQ.question || '—'}</div>
                                                                                </div>
                                                                            </div>
                                                                            {/* Options Diff */}
                                                                            {inputQ.options?.length > 0 && (
                                                                                <div className="pt-2 border-t border-neutral-800/50">
                                                                                    <div className="text-[9px] text-neutral-500 uppercase mb-1">Options</div>
                                                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                                        <div className="space-y-1">
                                                                                            {inputQ.options.map((opt: string, i: number) => (
                                                                                                <div key={i} className="text-neutral-500">{String.fromCharCode(65 + i)}. {opt}</div>
                                                                                            ))}
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            {(outputQ.options || []).map((opt: string, i: number) => (
                                                                                                <div key={i} className="text-green-400/80">{String.fromCharCode(65 + i)}. {opt}</div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        } catch {
                                                            return <div className="text-amber-500">Unable to parse output for diff comparison</div>;
                                                        }
                                                    })() : (
                                                        <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm h-full">
                                                            Run a batch to compare input/output
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Footer with pagination */}
                                        <div className="px-3 py-2 border-t border-neutral-800 flex items-center justify-between">
                                            <button
                                                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage <= 1}
                                                className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-[10px] text-neutral-500">
                                                Batch <span className="text-white font-medium">{currentPage}</span>/{totalPages}
                                                <span className="ml-1 text-neutral-600">({previewQs.length} items)</span>
                                            </span>
                                            <button
                                                onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage >= totalPages}
                                                className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                );
                            })() : (
                                <div className="flex-1 flex flex-col items-center pt-4 space-y-2">
                                    <span className="text-[10px] text-neutral-600 [writing-mode:vertical-rl] rotate-180">PREVIEW</span>
                                    {localCheckedIds.length > 0 && (
                                        <span className="text-[10px] text-indigo-400 font-mono">{localCheckedIds.length}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Console / Results - Resizable-ish (Fixed height for now) */}
                    <div className="h-1/3 min-h-[250px] border-t border-neutral-800 bg-neutral-950 flex flex-col">

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-800 px-4">
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <Terminal className="w-3 h-3" />
                                Console Output
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'results' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                Results Preview ({results.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                            {activeTab === 'logs' ? (
                                <div className="space-y-1">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-neutral-500 break-words">{log}</div>
                                    ))}
                                    <div ref={logsEndRef} />
                                    {logs.length === 0 && <span className="text-neutral-700 italic">Ready to start...</span>}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map((res, i) => (
                                        <div key={i} className="grid grid-cols-2 gap-4 pb-2 border-b border-neutral-900 last:border-0">
                                            <div className="text-neutral-500 opacity-60">{res.original}</div>
                                            <div className="text-green-400">{res.translated}</div>
                                        </div>
                                    ))}
                                    {results.length === 0 && <span className="text-neutral-700 italic">No results yet...</span>}
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {isRunning && (
                            <div className="h-1 bg-neutral-800 w-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
