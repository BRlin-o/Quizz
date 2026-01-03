"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Variable } from '@/config/translation';

interface AdditionalDataInputProps {
    variables: Variable[];
    onChange: (variables: Variable[]) => void;
    targetLang?: string;
}

export default function AdditionalDataInput({ variables, onChange, targetLang }: AdditionalDataInputProps) {
    const [files, setFiles] = useState<string[]>([]);
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [newVarType, setNewVarType] = useState<'text' | 'file' | 'template'>('text');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files');
            const data = await res.json();
            if (data.files) setFiles(data.files);
        } catch (e) {
            console.error("Failed to load files", e);
        }
    };

    const addVariable = () => {
        if (!newVarKey) return;
        const newVar: Variable = {
            id: Date.now().toString(),
            key: newVarKey,
            value: newVarValue,
            type: newVarType,
            fileName: newVarType === 'file' ? newVarValue : undefined
        };
        onChange([newVar, ...variables]);
        setNewVarKey('');
        setNewVarValue('');
    };

    const removeVariable = (id: string) => {
        onChange(variables.filter(v => v.id !== id));
    };

    const startEdit = (v: Variable) => {
        setEditingId(v.id);
        setEditValue(v.value || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = (id: string) => {
        onChange(variables.map(v =>
            v.id === id
                ? { ...v, value: editValue, fileName: v.type === 'file' ? editValue : v.fileName }
                : v
        ));
        setEditingId(null);
        setEditValue('');
    };

    return (
        <div className="space-y-3 min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Additional Data (Variables)</h3>
            <div className="bg-neutral-800/50 rounded-lg border border-neutral-800 p-4 space-y-3 overflow-hidden">
                {/* Input Row */}
                <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-2">
                        <input
                            type="text"
                            value={newVarKey}
                            onChange={(e) => setNewVarKey(e.target.value)}
                            placeholder="Key (e.g. style)"
                            className="col-span-3 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none min-w-0"
                        />
                        <select
                            value={newVarType}
                            onChange={(e) => setNewVarType(e.target.value as any)}
                            className="col-span-2 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-300 focus:ring-1 focus:ring-indigo-500 outline-none min-w-0"
                        >
                            <option value="text">Text</option>
                            <option value="file">File</option>
                            <option value="template">Template</option>
                        </select>

                        {newVarType === 'text' ? (
                            <input
                                type="text"
                                value={newVarValue}
                                onChange={(e) => setNewVarValue(e.target.value)}
                                placeholder="Value"
                                className="col-span-7 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none min-w-0"
                            />
                        ) : newVarType === 'file' ? (
                            <select
                                value={newVarValue}
                                onChange={(e) => setNewVarValue(e.target.value)}
                                className="col-span-7 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none min-w-0"
                            >
                                <option value="">Select File...</option>
                                {files.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        ) : (
                            <div className="col-span-7 flex flex-col gap-2 min-w-0">
                                <select
                                    onChange={(e) => setNewVarValue(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-400 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Load Preset --</option>
                                    <option value={`Input JSON Format:\n[{"id": 1, "question": "...", "type": "..."}]\nOutput JSON Format:\n[{"id": 1, "question": "Translated...", "type": "..."}]\nRETURN ONLY JSON.`}>JSON Batch Format</option>
                                    <option value={`You are a professional translator specializing in ${targetLang}.`}>Professional Persona</option>
                                </select>
                                <textarea
                                    value={newVarValue}
                                    onChange={(e) => setNewVarValue(e.target.value)}
                                    placeholder="Template Content..."
                                    className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs font-mono text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={addVariable}
                        disabled={!newVarKey || !newVarValue}
                        className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start mt-0.5 flex-shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-1">
                    {variables.map(v => (
                        <div key={v.id} className="bg-neutral-900 px-3 py-2 rounded border border-neutral-800 text-sm group min-w-0 overflow-hidden">
                            {editingId === v.id ? (
                                /* Edit Mode */
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-indigo-400 flex-shrink-0">{`{{${v.key}}}`}</span>
                                        <span className="text-neutral-600 text-[10px] uppercase px-1.5 py-0.5 bg-neutral-800 rounded flex-shrink-0">{v.type}</span>
                                    </div>
                                    {v.type === 'file' ? (
                                        <select
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">Select File...</option>
                                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    ) : v.type === 'template' ? (
                                        <textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full h-24 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs font-mono text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    )}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1 text-neutral-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => saveEdit(v.id)}
                                            className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-mono text-indigo-400 flex-shrink-0">{`{{${v.key}}}`}</span>
                                    <span className="text-neutral-600 text-[10px] uppercase px-1.5 py-0.5 bg-neutral-800 rounded flex-shrink-0">{v.type}</span>
                                    <span
                                        className="text-neutral-300 flex-1 min-w-0 truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                                        title={v.value}
                                    >
                                        {v.fileName || v.value}
                                    </span>
                                    <button
                                        onClick={() => startEdit(v)}
                                        className="text-neutral-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeVariable(v.id)}
                                        className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {variables.length === 0 && (
                        <p className="text-neutral-600 text-sm italic text-center py-2">No variables added</p>
                    )}

                    {/* System Variable Hint */}
                    <div className="flex items-center gap-3 bg-neutral-900/40 px-3 py-2 rounded border border-neutral-800/50 border-dashed text-sm select-none min-w-0" title="This variable is automatically populated based on your target language selection">
                        <span className="font-mono text-indigo-400/70 flex-shrink-0">{'{{TARGET_LANGUAGE}}'}</span>
                        <span className="text-neutral-600 text-[10px] uppercase px-1.5 py-0.5 bg-neutral-800 rounded flex-shrink-0">AUTO</span>
                        <span className="text-neutral-300 flex-1 min-w-0 truncate">
                            {targetLang || 'zh-TW'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
