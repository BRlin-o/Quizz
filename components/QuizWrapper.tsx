'use client';

import { useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Question, PracticeSession } from '@/types';
import QuizInterface from '@/components/QuizInterface';
import AutoSaveProvider from '@/components/AutoSaveProvider';

interface QuizWrapperProps {
    questions: Question[];
    title: string;
    mode: string;
    // Additional props for session tracking
    quizSlug: string;
    filenames: string[];
    shuffleSeed?: string;
    // Optional: resume from existing session
    resumeSession?: PracticeSession | null;
}

export default function QuizWrapper({
    questions,
    title,
    mode,
    quizSlug,
    filenames,
    shuffleSeed,
    resumeSession
}: QuizWrapperProps) {
    const startQuiz = useQuizStore((state) => state.startQuiz);
    const startQuizFromSession = useQuizStore((state) => state.startQuizFromSession);
    const updateSettings = useQuizStore((state) => state.updateSettings);

    useEffect(() => {
        // Set initial language preference based on mode
        const lang = mode === 'translated' ? 'zh' : 'en';
        updateSettings({ preferredLanguage: lang });

        if (resumeSession) {
            // Resume from existing session
            startQuizFromSession(resumeSession);
        } else {
            // Start fresh
            startQuiz(questions, title);
        }
    }, [questions, title, startQuiz, startQuizFromSession, mode, updateSettings, resumeSession]);

    return (
        <AutoSaveProvider
            quizSlug={quizSlug}
            filenames={filenames}
            shuffleSeed={shuffleSeed}
            mode={mode}
        >
            <QuizInterface />
        </AutoSaveProvider>
    );
}

