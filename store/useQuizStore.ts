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
        shuffleOptions?: boolean; // New Setting
    };
    updateSettings: (settings: Partial<{
        autoAdvance: boolean;
        preferredLanguage: string;
        fontSize: 'sm' | 'md' | 'lg' | 'xl';
        density: 'compact' | 'comfortable';
        layoutMode: 'centered' | 'full';
        shuffleOptions: boolean;
    }>) => void;
    // Store original questions to support toggling shuffle off
    originalQuestions: Question[];
}

import { persist } from 'zustand/middleware';
import { shuffleOptionsInPlace } from '@/lib/shuffle';

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            questions: [],
            originalQuestions: [], // Initialize
            quizTitle: '',
            currentIndex: 0,
            answers: {},
            bookmarkedQuestions: [],
            sessionId: null,
            isStarted: false,
            isFinished: false,
            score: 0,

            startQuiz: (questions, title) => {
                // Determine if we should shuffle options based on current settings (or default)
                // However, we want to respect the persisted 'settings.shuffleOptions' if it exists.
                // Or maybe we treat 'startQuiz' as a reset.
                // Let's assume the component calls 'updateSettings' or we read from settings.

                const currentSettings = get().settings;
                const originalQuestions = JSON.parse(JSON.stringify(questions)); // Deep copy

                let initialQuestions = JSON.parse(JSON.stringify(questions));

                if (currentSettings.shuffleOptions) {
                    initialQuestions = shuffleOptionsInPlace(initialQuestions);
                }

                set({
                    questions: initialQuestions,
                    originalQuestions: originalQuestions,
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
                // When restoring, we don't have originalQuestions stored in session currently.
                // We'll just assume the session questions are the "original" for now if we can't recover.
                // OR we can't toggle shuffle OFF for resumed sessions effectively without storage migration.
                // For now, let's just initialize originalQuestions as a copy of session.questions to prevent crashes,
                // but acknowledge that 'unshuffling' implies reverting to what was in the session.

                set({
                    questions: session.questions,
                    originalQuestions: JSON.parse(JSON.stringify(session.questions)), // Best effort
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
                set((state) => {
                    // Re-apply shuffle logic on restart?
                    // If shuffleOptions is on, we should re-shuffle to give a fresh experience!
                    // This matches user request: "every time I open it... display different order"

                    let newQuestions = JSON.parse(JSON.stringify(state.originalQuestions));
                    if (state.settings.shuffleOptions) {
                        newQuestions = shuffleOptionsInPlace(newQuestions);
                    }

                    return {
                        questions: newQuestions,
                        currentIndex: 0,
                        answers: {},
                        bookmarkedQuestions: [],
                        isFinished: false,
                        score: 0,
                        isStarted: true,
                    };
                });
            },

            // Settings
            settings: {
                autoAdvance: false,
                preferredLanguage: 'en', // 'en' or 'zh'
                fontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'
                density: 'comfortable', // 'compact' | 'comfortable'
                layoutMode: 'centered', // 'centered' | 'full'
                shuffleOptions: false,
            },
            updateSettings: (newSettings) => {
                set((state) => {
                    const mergedSettings = { ...state.settings, ...newSettings };

                    // Handle Shuffle Toggle Logic
                    // If shuffleOptions changed...
                    if (newSettings.shuffleOptions !== undefined && newSettings.shuffleOptions !== state.settings.shuffleOptions) {
                        const shouldShuffle = newSettings.shuffleOptions;

                        // We need to update 'questions'
                        // Challenge: Preserving answers is hard because labels change.
                        // For this implementation, we will CLEAR answers when toggling shuffle mid-quiz
                        // to avoid data corruption, OR we accept that it resets the current view.
                        // Ideally, we re-map answers, but that requires complex diffing.
                        // Given the user constraint "simple", we will just re-generate questions.
                        // But wait, clearing answers mid-quiz is bad UX.

                        // Let's try to map answers if possible.
                        // If we can't map easily, we just keep answers as is (which might be wrong).
                        // Let's rely on restartQuiz for "clean" shuffle.
                        // BUT user wants "switch in settings".
                        // If I switch in settings, I expect immediate effect.

                        let updatedQuestions = [...state.questions];
                        let updatedAnswers = { ...state.answers };

                        if (shouldShuffle) {
                            // Turn ON: Shuffle original (or current?)
                            // Always shuffle from ORIGINAL to ensure randomness isn't biased by previous shuffles
                            // and to allow consistent "reset".
                            const clonedOriginals = JSON.parse(JSON.stringify(state.originalQuestions));

                            // WE MUST MAP ANSWERS via TEXT content
                            // 1. Snapshot current answers (label based) -> Text based
                            const answersAsText: Record<string | number, string> = {};
                            state.questions.forEach(q => {
                                const ansLabel = state.answers[q.id];
                                if (ansLabel) {
                                    const opt = q.options.find(o => o.label === ansLabel);
                                    if (opt) answersAsText[q.id] = opt.text;
                                }
                            });

                            // 2. Shuffle
                            const shuffled = shuffleOptionsInPlace(clonedOriginals);
                            updatedQuestions = shuffled;

                            // 3. Restore answers (Text -> New Label)
                            const newAnswers: Record<string | number, string> = {};
                            updatedQuestions.forEach(q => {
                                const textAns = answersAsText[q.id];
                                if (textAns) {
                                    const newOpt = q.options.find(o => o.text === textAns);
                                    if (newOpt) newAnswers[q.id] = newOpt.label;
                                }
                            });
                            updatedAnswers = newAnswers;

                        } else {
                            // Turn OFF: Restore Original
                            const restored = JSON.parse(JSON.stringify(state.originalQuestions));

                            // 1. Snapshot current answers -> Text based
                            const answersAsText: Record<string | number, string> = {};
                            state.questions.forEach(q => {
                                const ansLabel = state.answers[q.id];
                                if (ansLabel) {
                                    const opt = q.options.find(o => o.label === ansLabel);
                                    if (opt) answersAsText[q.id] = opt.text;
                                }
                            });

                            updatedQuestions = restored;

                            // 2. Restore answers
                            const newAnswers: Record<string | number, string> = {};
                            updatedQuestions.forEach(q => {
                                const textAns = answersAsText[q.id];
                                if (textAns) {
                                    const newOpt = q.options.find(o => o.text === textAns);
                                    if (newOpt) newAnswers[q.id] = newOpt.label;
                                }
                            });
                            updatedAnswers = newAnswers;
                        }

                        return {
                            settings: mergedSettings,
                            questions: updatedQuestions,
                            answers: updatedAnswers
                        };
                    }

                    return {
                        settings: mergedSettings
                    };
                });
            },
        }),
        {
            name: 'quiz-storage', // unique name
            partialize: (state) => ({
                settings: state.settings,
                // We should probably persist originalQuestions too if we want to restore after reload
                originalQuestions: state.originalQuestions
            }),
        }
    )
);
