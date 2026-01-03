'use client';

import { useState, useRef } from 'react';
import { PracticeSession } from '@/types';
import AnalysisNavigator from './AnalysisNavigator';
import AnalysisQuestionList, { FilterType } from './AnalysisQuestionList';
import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AnalysisBoardProps {
    session: PracticeSession;
}

export default function AnalysisBoard({ session }: AnalysisBoardProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const questionRefs = useRef<Record<string | number, HTMLDivElement | null>>({});

    const handleSelectQuestion = (id: string | number) => {
        setSelectedId(id);
        setFilter('all'); // Reset filter to ensure the question is visible

        // Scroll to question
        const element = questionRefs.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/quiz/${session.quizSlug}`}>
                        <Button variant="light" startContent={<ArrowLeft size={18} />}>
                            Back to Quiz
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Analysis Report</h1>
                        <p className="text-slate-500">
                            {session.quizTitle} • {new Date(session.lastUpdatedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigator */}
                    <div className="lg:col-span-4 xl:col-span-3 order-1 lg:order-1">
                        <AnalysisNavigator
                            totalQuestions={session.totalQuestions}
                            answers={session.answers}
                            questions={session.questions}
                            bookmarkedQuestions={session.bookmarkedQuestions}
                            selectedId={selectedId}
                            onSelect={handleSelectQuestion}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 xl:col-span-9 order-2 lg:order-2">
                        <AnalysisQuestionList
                            questions={session.questions}
                            answers={session.answers}
                            bookmarkedQuestions={session.bookmarkedQuestions}
                            filter={filter}
                            setFilter={setFilter}
                            refs={questionRefs}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
