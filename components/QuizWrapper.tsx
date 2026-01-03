'use client';

import { useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Question } from '@/types';
import QuizInterface from '@/components/QuizInterface'; // We will create this next

interface QuizWrapperProps {
    questions: Question[];
    title: string;
    mode: string;
}

export default function QuizWrapper({ questions, title, mode }: QuizWrapperProps) {
    const startQuiz = useQuizStore((state) => state.startQuiz);
    const updateSettings = useQuizStore((state) => state.updateSettings);

    useEffect(() => {
        // Set initial language preference based on mode
        const lang = mode === 'translated' ? 'zh' : 'en';
        updateSettings({ preferredLanguage: lang });

        startQuiz(questions, title);
    }, [questions, title, startQuiz, mode, updateSettings]);

    return <QuizInterface />;
}
