'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePracticeStore } from '@/store/usePracticeStore';
import { PracticeSession } from '@/types';
import { Card, CardBody, Button, Tooltip, Progress } from '@heroui/react';
import {
    History,
    CheckCircle2,
    Clock,
    Trash2,
    PlayCircle,
    Bookmark,
    Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PracticeHistoryProps {
    slug: string;
}

export default function PracticeHistory({ slug }: PracticeHistoryProps) {
    const router = useRouter();
    // Subscribe to sessions directly so we re-render on changes
    const allSessions = usePracticeStore(state => state.sessions);
    const deleteSession = usePracticeStore(state => state.deleteSession);

    // Fix hydration mismatch by only rendering after mount
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sessions = useMemo(() => {
        if (!isMounted) return [];
        return allSessions
            .filter(s => s.quizSlug === slug)
            .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
    }, [allSessions, slug, isMounted]);

    if (!isMounted || sessions.length === 0) {
        return null;
    }

    const handleResume = (session: PracticeSession) => {
        if (session.isCompleted) {
            router.push(`/quiz/${slug}/analysis/${session.id}`);
            return;
        }

        const params = new URLSearchParams();
        params.set('mode', session.mode);
        params.set('files', session.filenames.join(','));
        if (session.shuffleSeed) {
            params.set('shuffle_seed', session.shuffleSeed);
        }
        params.set('resume', session.id);
        router.push(`/quiz/${slug}/play?${params.toString()}`);
    };

    const handleDelete = (sessionId: string) => {
        deleteSession(sessionId);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-TW', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (percentage: number): "success" | "primary" | "warning" | "danger" => {
        if (percentage >= 90) return 'success';
        if (percentage >= 70) return 'primary';
        if (percentage >= 50) return 'warning';
        return 'danger';
    };

    return (
        <Card className="w-full">
            <CardBody className="p-3">
                <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">History</span>
                    <span className="text-xs text-slate-400">{sessions.length}</span>
                </div>

                <div className="space-y-2">
                    {sessions.map((session) => {
                        const answeredCount = Object.keys(session.answers).length;
                        const totalCount = session.totalQuestions;
                        const progressPercent = Math.round((answeredCount / totalCount) * 100);
                        const scorePercent = session.isCompleted && session.score !== undefined
                            ? Math.round((session.score / totalCount) * 100)
                            : null;

                        return (
                            <div
                                key={session.id}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                {/* Status Icon */}
                                <Tooltip content={session.isCompleted ? 'Completed' : 'In Progress'}>
                                    <div className={`flex-shrink-0 ${session.isCompleted ? 'text-green-500' : 'text-amber-500'}`}>
                                        {session.isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                    </div>
                                </Tooltip>

                                {/* Progress/Score */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Progress
                                            size="sm"
                                            value={scorePercent ?? progressPercent}
                                            color={scorePercent !== null ? getScoreColor(scorePercent) : 'default'}
                                            className="flex-1 max-w-[80px]"
                                        />
                                        <span className={`text-xs font-medium ${scorePercent !== null
                                            ? (scorePercent >= 70 ? 'text-green-600' : scorePercent >= 50 ? 'text-amber-600' : 'text-red-600')
                                            : 'text-slate-500'
                                            }`}>
                                            {scorePercent !== null
                                                ? `${session.score}/${totalCount}`
                                                : `${answeredCount}/${totalCount}`
                                            }
                                        </span>
                                    </div>
                                    {/* Compact metadata */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                        <span>{formatDate(session.lastUpdatedAt)}</span>
                                        {session.shuffleSeed && session.shuffleSeed !== '-1' && (
                                            <span className="text-slate-300">#{session.shuffleSeed}</span>
                                        )}
                                        {session.bookmarkedQuestions.length > 0 && (
                                            <Bookmark size={10} className="text-amber-400" fill="currentColor" />
                                        )}
                                    </div>
                                </div>

                                {/* Actions - show on hover */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Tooltip content={session.isCompleted ? 'Review' : 'Resume'}>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="primary"
                                            onPress={() => handleResume(session)}
                                        >
                                            {session.isCompleted ? <Trophy size={14} /> : <PlayCircle size={14} />}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Delete">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => handleDelete(session.id)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card >
    );
}

