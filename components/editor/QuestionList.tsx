"use client";

import React from 'react';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface Question {
    id: number | string;
    question: string;
    type?: string;
}

interface QuestionListProps {
    questions: Question[];
    selectedId: number | string | null;
    onSelect: (id: number | string) => void;
    checkedIds: (number | string)[];
    onToggleCheck: (id: number | string) => void;
    onToggleAll: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export default function QuestionList({ questions, selectedId, onSelect, checkedIds, onToggleCheck, onToggleAll, searchTerm, onSearchChange }: QuestionListProps) {
    const filteredQuestions = questions.filter(q =>
        q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(q.id).includes(searchTerm)
    );

    return (
        <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 w-80 flex-shrink-0">
            <div className="p-4 border-b border-neutral-800">
                <h2 className="text-lg font-bold text-white mb-4">Questions ({questions.length})</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search ID or text..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center text-neutral-500 py-8 text-sm">No questions found</div>
                ) : (
                    filteredQuestions.map(q => (
                        <button
                            key={q.id}
                            onClick={() => onSelect(q.id)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all group ${selectedId === q.id
                                ? 'bg-indigo-600/10 border border-indigo-500/50 text-white'
                                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border border-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${selectedId === q.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-neutral-800 text-neutral-500'}`}>
                                    #{q.id}
                                </span>
                                {q.type && (
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-600 group-hover:text-neutral-500">
                                        {q.type}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 line-clamp-2 leading-relaxed opacity-90">
                                {q.question || "No text"}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
