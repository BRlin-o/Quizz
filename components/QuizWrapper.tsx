'use client';

import { useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Question } from '@/types';
import QuizInterface from '@/components/QuizInterface'; // We will create this next

interface QuizWrapperProps {
    questions: Question[];
    title: string;
}

export default function QuizWrapper({ questions, title }: QuizWrapperProps) {
    const startQuiz = useQuizStore((state) => state.startQuiz);

    useEffect(() => {
        startQuiz(questions, title);
    }, [questions, title, startQuiz]);

    return <QuizInterface />;
}
