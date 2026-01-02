'use client';

import { useQuizStore } from '@/store/useQuizStore';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import ResultView from './ResultView';
import { Button, Card, Spinner } from '@heroui/react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import QuestionNavigator from './QuestionNavigator';
import { useState } from 'react';
import LanguageSwitcher, { LanguageMode } from './LanguageSwitcher';
import QuizSettings from './QuizSettings';

export default function QuizInterface() {
    // Select atomic state to prevent infinite re-renders or snapshot issues
    const currentQuestion = useQuizStore((state) => state.questions[state.currentIndex]);
    const isFinished = useQuizStore((state) => state.isFinished);
    const questionsLength = useQuizStore((state) => state.questions.length);
    const quizTitle = useQuizStore((state) => state.quizTitle);
    const currentIndex = useQuizStore((state) => state.currentIndex);

    const [languageMode, setLanguageMode] = useState<LanguageMode>('en');

    if (isFinished) {
        return <ResultView />;
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" label="Loading Quiz..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-6 font-sans text-slate-800">
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button
                            as={Link}
                            href="/"
                            variant="light"
                            isIconOnly
                            className="text-slate-500 hover:text-slate-900"
                            aria-label="Back to Home"
                        >
                            <ChevronLeft size={24} />
                        </Button>
                        <QuestionNavigator />
                    </div>

                    <div className="flex-1 text-center px-4 hidden md:block">
                        <h1 className="text-lg font-bold text-slate-900 truncate">
                            {quizTitle}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                        <QuizSettings />
                        <LanguageSwitcher currentMode={languageMode} onModeChange={setLanguageMode} />
                        <div className="flex flex-col items-end">
                            <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 whitespace-nowrap">
                                Q{currentIndex + 1} / {questionsLength}
                            </div>
                            {currentQuestion?.originalIndex && (
                                <span className="text-[10px] text-slate-400 mt-1 mr-2">
                                    Original #{currentQuestion.originalIndex}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="flex-1 shadow-xl rounded-3xl overflow-visible border-none bg-white">
                    <div className="p-6 md:p-8 flex flex-col h-full">
                        <ProgressBar />
                        <QuestionCard languageMode={languageMode} />
                    </div>
                </Card>
            </div>
        </div>
    );
}
