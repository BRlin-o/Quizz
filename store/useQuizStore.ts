import { create } from 'zustand';
import { Question, PracticeSession } from '@/types';

interface QuizState {
    questions: Question[];
    quizTitle: string;
    currentIndex: number;
    answers: Record<string | number, string>; // question id -> selected option label
    bookmarkedQuestions: (string | number)[];  // Bookmarked question IDs
    sessionId: string | null;                  // Current session ID
    isStarted: boolean;
    isFinished: boolean;
    score: number;

    // Actions
    startQuiz: (questions: Question[], title: string) => void;
    startQuizFromSession: (session: PracticeSession) => void;  // Restore from session
    answerQuestion: (questionId: string | number, answer: string) => void;
    toggleBookmark: (questionId: string | number) => void;     // Toggle bookmark
    isBookmarked: (questionId: string | number) => boolean;    // Check if bookmarked
    nextQuestion: () => void;
    prevQuestion: () => void;
    jumpToQuestion: (index: number) => void;
    restartQuiz: () => void;
    finishQuiz: () => void;
    setSessionId: (id: string) => void;

    // Settings state & actions
    settings: {
        autoAdvance: boolean;
        preferredLanguage?: string;
        fontSize?: 'sm' | 'md' | 'lg' | 'xl';
        density?: 'compact' | 'comfortable';
        layoutMode?: 'centered' | 'full';
    };
    updateSettings: (settings: Partial<{
        autoAdvance: boolean;
        preferredLanguage: string;
        fontSize: 'sm' | 'md' | 'lg' | 'xl';
        density: 'compact' | 'comfortable';
        layoutMode: 'centered' | 'full';
    }>) => void;
}

import { persist } from 'zustand/middleware';

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            questions: [],
            quizTitle: '',
            currentIndex: 0,
            answers: {},
            bookmarkedQuestions: [],
            sessionId: null,
            isStarted: false,
            isFinished: false,
            score: 0,

            startQuiz: (questions, title) => {
                set({
                    questions,
                    quizTitle: title,
                    currentIndex: 0,
                    answers: {},
                    bookmarkedQuestions: [],
                    sessionId: null,
                    isStarted: true,
                    isFinished: false,
                    score: 0,
                });
            },

            startQuizFromSession: (session) => {
                set({
                    questions: session.questions,
                    quizTitle: session.quizTitle,
                    currentIndex: session.currentIndex,
                    answers: session.answers,
                    bookmarkedQuestions: session.bookmarkedQuestions,
                    sessionId: session.id,
                    isStarted: true,
                    isFinished: false,
                    score: 0,
                });
            },

            answerQuestion: (questionId, answer) => {
                set((state) => ({
                    answers: { ...state.answers, [questionId]: answer },
                }));
            },

            toggleBookmark: (questionId) => {
                set((state) => {
                    const isCurrentlyBookmarked = state.bookmarkedQuestions.includes(questionId);
                    if (isCurrentlyBookmarked) {
                        return {
                            bookmarkedQuestions: state.bookmarkedQuestions.filter(id => id !== questionId)
                        };
                    } else {
                        return {
                            bookmarkedQuestions: [...state.bookmarkedQuestions, questionId]
                        };
                    }
                });
            },

            isBookmarked: (questionId) => {
                return get().bookmarkedQuestions.includes(questionId);
            },

            setSessionId: (id) => {
                set({ sessionId: id });
            },

            nextQuestion: () => {
                set((state) => {
                    if (state.currentIndex < state.questions.length - 1) {
                        return { currentIndex: state.currentIndex + 1 };
                    }
                    return {};
                });
            },

            prevQuestion: () => {
                set((state) => {
                    if (state.currentIndex > 0) {
                        return { currentIndex: state.currentIndex - 1 };
                    }
                    return {};
                });
            },

            jumpToQuestion: (index) => {
                set((state) => {
                    if (index >= 0 && index < state.questions.length) {
                        return { currentIndex: index };
                    }
                    return {};
                });
            },

            finishQuiz: () => {
                const state = get();
                let calculatedScore = 0;

                state.questions.forEach((q) => {
                    const userAnswer = state.answers[q.id];
                    if (userAnswer === q.correct_answer) {
                        calculatedScore++;
                    }
                });

                set({ isFinished: true, score: calculatedScore });
            },

            restartQuiz: () => {
                set(() => ({
                    currentIndex: 0,
                    answers: {},
                    bookmarkedQuestions: [],
                    isFinished: false,
                    score: 0,
                    isStarted: true,
                }));
            },

            // Settings
            settings: {
                autoAdvance: false,
                preferredLanguage: 'en', // 'en' or 'zh'
                fontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'
                density: 'comfortable', // 'compact' | 'comfortable'
                layoutMode: 'centered', // 'centered' | 'full'
            },
            updateSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                }));
            },
        }),
        {
            name: 'quiz-storage', // unique name
            partialize: (state) => ({ settings: state.settings }), // Only persist settings
        }
    )
);
