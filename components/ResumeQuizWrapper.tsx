'use client';

import { useEffect, useState } from 'react';
import { usePracticeStore } from '@/store/usePracticeStore';
import { PracticeSession, Question } from '@/types';
import QuizWrapper from '@/components/QuizWrapper';

interface ResumeQuizWrapperProps {
    questions: Question[];
    title: string;
    mode: string;
    quizSlug: string;
    filenames: string[];
    shuffleSeed?: string;
    resumeSessionId?: string;
}

export default function ResumeQuizWrapper({
    questions,
    title,
    mode,
    quizSlug,
    filenames,
    shuffleSeed,
    resumeSessionId
}: ResumeQuizWrapperProps) {
    const [resumeSession, setResumeSession] = useState<PracticeSession | null>(null);
    const [isLoading, setIsLoading] = useState(!!resumeSessionId);

    const sessions = usePracticeStore(state => state.sessions);

    useEffect(() => {
        if (resumeSessionId) {
            const session = sessions.find(s => s.id === resumeSessionId);
            if (session) {
                setResumeSession(session);
            }
            setIsLoading(false);
        }
    }, [resumeSessionId, sessions]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-500">Loading session...</div>
            </div>
        );
    }

    return (
        <QuizWrapper
            questions={resumeSession ? resumeSession.questions : questions}
            title={title}
            mode={mode}
            quizSlug={quizSlug}
            filenames={filenames}
            shuffleSeed={shuffleSeed}
            resumeSession={resumeSession}
        />
    );
}
