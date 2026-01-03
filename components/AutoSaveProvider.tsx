'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { PracticeSession } from '@/types';

interface AutoSaveProviderProps {
    children: React.ReactNode;
    quizSlug: string;
    filenames: string[];
    shuffleSeed?: string;
    mode: string;
}

// Generate a simple UUID
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function AutoSaveProvider({
    children,
    quizSlug,
    filenames,
    shuffleSeed,
    mode
}: AutoSaveProviderProps) {
    const questions = useQuizStore(state => state.questions);
    const quizTitle = useQuizStore(state => state.quizTitle);
    const currentIndex = useQuizStore(state => state.currentIndex);
    const answers = useQuizStore(state => state.answers);
    const bookmarkedQuestions = useQuizStore(state => state.bookmarkedQuestions);
    const isFinished = useQuizStore(state => state.isFinished);
    const score = useQuizStore(state => state.score);
    const sessionId = useQuizStore(state => state.sessionId);
    const setSessionId = useQuizStore(state => state.setSessionId);

    const saveSession = usePracticeStore(state => state.saveSession);

    const isInitialized = useRef(false);
    const lastSaveRef = useRef<string>('');

    // Create or update the session
    const saveCurrentSession = useCallback(() => {
        if (questions.length === 0 || !quizTitle) return;

        const now = new Date().toISOString();

        const session: PracticeSession = {
            id: sessionId || generateId(),
            quizSlug,
            quizTitle,
            filenames,
            shuffleSeed,
            mode,
            questions,
            currentIndex,
            answers,
            bookmarkedQuestions,
            startedAt: now, // Will be overwritten if already exists
            lastUpdatedAt: now,
            completedAt: isFinished ? now : undefined,
            isCompleted: isFinished,
            score: isFinished ? score : undefined,
            totalQuestions: questions.length,
        };

        // Generate a signature to avoid unnecessary saves
        const signature = JSON.stringify({
            currentIndex,
            answers,
            bookmarkedQuestions,
            isFinished,
            score
        });

        if (signature !== lastSaveRef.current) {
            // Update session ID in store if new
            if (!sessionId) {
                setSessionId(session.id);
            }

            saveSession(session);
            lastSaveRef.current = signature;
        }
    }, [
        questions,
        quizTitle,
        currentIndex,
        answers,
        bookmarkedQuestions,
        isFinished,
        score,
        sessionId,
        setSessionId,
        saveSession,
        quizSlug,
        filenames,
        shuffleSeed,
        mode
    ]);

    // Initialize session on mount
    useEffect(() => {
        if (!isInitialized.current && questions.length > 0) {
            isInitialized.current = true;

            // Check if we actually have data to save
            const hasProgress = currentIndex > 0 || Object.keys(answers).length > 0 || isFinished;
            if (hasProgress) {
                saveCurrentSession();
            }
        }
    }, [questions.length, currentIndex, answers, isFinished, saveCurrentSession]);

    // Auto-save on state changes (debounced)
    useEffect(() => {
        if (!isInitialized.current) return;

        const timeoutId = setTimeout(() => {
            // Check if we actually have data to save
            const hasProgress = currentIndex > 0 || Object.keys(answers).length > 0 || isFinished;
            if (hasProgress) {
                saveCurrentSession();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [currentIndex, answers, bookmarkedQuestions, isFinished, saveCurrentSession]);

    // Save before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveCurrentSession();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveCurrentSession]);

    return <>{children}</>;
}
