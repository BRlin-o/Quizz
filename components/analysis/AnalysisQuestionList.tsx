'use client';

import { Question } from '@/types';
import AnalysisQuestionCard from './AnalysisQuestionCard';
import { Button } from '@heroui/react';
import { Filter, Bookmark, XCircle, LayoutGrid } from 'lucide-react';

export type FilterType = 'all' | 'incorrect' | 'bookmarked';

interface AnalysisQuestionListProps {
    questions: Question[];
    answers: Record<string | number, string>;
    bookmarkedQuestions: (string | number)[];
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
    refs: React.MutableRefObject<Record<string | number, HTMLDivElement | null>>;
}

export default function AnalysisQuestionList({
    questions,
    answers,
    bookmarkedQuestions,
    filter,
    setFilter,
    refs
}: AnalysisQuestionListProps) {

    // Filter logic
    const filteredQuestions = questions.filter(q => {
        if (filter === 'all') return true;

        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;

        if (filter === 'incorrect') return !isCorrect && !!userAnswer;
        if (filter === 'bookmarked') return bookmarkedQuestions.includes(q.id);

        return true;
    });

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 sticky top-24 z-10 bg-slate-50 py-2 -mt-2">
                <Button
                    variant={filter === 'all' ? 'solid' : 'bordered'}
                    color={filter === 'all' ? 'primary' : 'default'}
                    startContent={<LayoutGrid size={16} />}
                    onPress={() => setFilter('all')}
                    className="flex-1 sm:flex-none"
                >
                    All Questions
                </Button>
                <Button
                    variant={filter === 'incorrect' ? 'solid' : 'bordered'}
                    color={filter === 'incorrect' ? 'danger' : 'default'}
                    startContent={<XCircle size={16} />}
                    onPress={() => setFilter('incorrect')}
                    className="flex-1 sm:flex-none"
                >
                    Incorrect Only
                </Button>
                <Button
                    variant={filter === 'bookmarked' ? 'solid' : 'bordered'}
                    color={filter === 'bookmarked' ? 'warning' : 'default'}
                    startContent={<Bookmark size={16} />}
                    onPress={() => setFilter('bookmarked')}
                    className="flex-1 sm:flex-none"
                >
                    Bookmarked
                </Button>
            </div>

            {/* Questions Stack */}
            <div className="space-y-8">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question, index) => (
                        <div
                            key={question.id}
                            ref={el => { if (el) refs.current[question.id] = el; }}
                            className="scroll-mt-32"
                        >
                            <AnalysisQuestionCard
                                question={question}
                                userAnswer={answers[question.id]}
                                isBookmarked={bookmarkedQuestions.includes(question.id)}
                                index={question.originalIndex !== undefined ? question.originalIndex - 1 : index}
                            />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">No questions match this filter.</p>
                        <Button
                            variant="light"
                            color="primary"
                            onPress={() => setFilter('all')}
                            className="mt-4"
                        >
                            Show All Questions
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
