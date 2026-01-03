'use client';

import { useEffect, useRef } from 'react';
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
    shuffleOptions?: boolean;
}

export default function QuizWrapper({
    questions,
    title,
    mode,
    quizSlug,
    filenames,
    shuffleSeed,
    resumeSession,
    shuffleOptions = false
}: QuizWrapperProps) {
    const startQuiz = useQuizStore((state) => state.startQuiz);
    const startQuizFromSession = useQuizStore((state) => state.startQuizFromSession);
    const updateSettings = useQuizStore((state) => state.updateSettings);

    useEffect(() => {
        // Set initial language preference based on mode
        const lang = mode === 'translated' ? 'zh' : 'en';

        // Update settings including shuffleOptions
        updateSettings({
            preferredLanguage: lang,
            shuffleOptions: shuffleOptions
        });

        if (resumeSession) {
            // Resume from existing session
            startQuizFromSession(resumeSession);
        } else {
            // Start fresh
            // Ensure we wait for the updateSettings to take effect if possible, 
            // but Zustand is synchronous usually.
            // However, startQuiz relies on `get().settings`.
            // Since updateSettings is called just before, and Zustand is sync, it should be fine.
            startQuiz(questions, title);
        }
    }, [questions, title, startQuiz, startQuizFromSession, mode, updateSettings, resumeSession, shuffleOptions]);

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

