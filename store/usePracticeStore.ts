import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PracticeSession } from '@/types';

const MAX_SESSIONS_PER_QUIZ = 5;

interface PracticeStore {
    sessions: PracticeSession[];

    // Get sessions for a specific quiz
    getSessionsByQuiz: (slug: string) => PracticeSession[];

    // Get in-progress session that matches criteria
    getInProgressSession: (slug: string, filenames: string[], mode: string) => PracticeSession | null;

    // Save or update a session
    saveSession: (session: PracticeSession) => void;

    // Delete a session
    deleteSession: (sessionId: string) => void;

    // Clear all sessions for a quiz
    clearQuizSessions: (slug: string) => void;

    // Get a specific session by ID
    getSession: (sessionId: string) => PracticeSession | undefined;
}

export const usePracticeStore = create<PracticeStore>()(
    persist(
        (set, get) => ({
            sessions: [],

            getSessionsByQuiz: (slug) => {
                return get().sessions
                    .filter(s => s.quizSlug === slug)
                    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
            },

            getInProgressSession: (slug, filenames, mode) => {
                const sessions = get().sessions;
                // Find a session that matches the quiz, files, mode, and is not completed
                return sessions.find(s =>
                    s.quizSlug === slug &&
                    s.mode === mode &&
                    !s.isCompleted &&
                    s.filenames.length === filenames.length &&
                    s.filenames.every(f => filenames.includes(f))
                ) || null;
            },

            getSession: (sessionId) => {
                return get().sessions.find(s => s.id === sessionId);
            },

            saveSession: (session) => {
                set((state) => {
                    const existingIndex = state.sessions.findIndex(s => s.id === session.id);
                    let newSessions: PracticeSession[];

                    if (existingIndex >= 0) {
                        // Update existing session
                        newSessions = [...state.sessions];
                        newSessions[existingIndex] = session;
                    } else {
                        // Add new session
                        newSessions = [session, ...state.sessions];
                    }

                    // Limit sessions per quiz
                    const quizSessions = newSessions.filter(s => s.quizSlug === session.quizSlug);
                    if (quizSessions.length > MAX_SESSIONS_PER_QUIZ) {
                        // Keep only the most recent sessions for this quiz
                        const sortedQuizSessions = quizSessions
                            .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
                        const sessionsToKeep = sortedQuizSessions.slice(0, MAX_SESSIONS_PER_QUIZ);
                        const sessionIdsToKeep = new Set(sessionsToKeep.map(s => s.id));

                        newSessions = newSessions.filter(s =>
                            s.quizSlug !== session.quizSlug || sessionIdsToKeep.has(s.id)
                        );
                    }

                    return { sessions: newSessions };
                });
            },

            deleteSession: (sessionId) => {
                set((state) => ({
                    sessions: state.sessions.filter(s => s.id !== sessionId)
                }));
            },

            clearQuizSessions: (slug) => {
                set((state) => ({
                    sessions: state.sessions.filter(s => s.quizSlug !== slug)
                }));
            },
        }),
        {
            name: 'practice-sessions-storage',
        }
    )
);
