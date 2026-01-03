import { create } from 'zustand';
import { Question } from '@/types';

interface QuizState {
    questions: Question[];
    quizTitle: string;
    currentIndex: number;
    answers: Record<string | number, string>; // question id -> selected option label
    isStarted: boolean;
    isFinished: boolean;
    score: number;

    // Actions
    startQuiz: (questions: Question[], title: string) => void;
    answerQuestion: (questionId: string | number, answer: string) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    jumpToQuestion: (index: number) => void;
    restartQuiz: () => void;
    finishQuiz: () => void;

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
            isStarted: false,
            isFinished: false,
            score: 0,

            startQuiz: (questions, title) => {
                set({
                    questions,
                    quizTitle: title,
                    currentIndex: 0,
                    answers: {},
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
