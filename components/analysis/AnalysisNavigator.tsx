'use client';

import {
    Button,
    Card,
    CardBody,
    ScrollShadow,
    Tooltip,
    cn
} from '@heroui/react';
import { Bookmark } from 'lucide-react';

interface AnalysisNavigatorProps {
    totalQuestions: number;
    answers: Record<string | number, string>;
    questions: any[]; // Using any[] for now, but should ideally be Question[]
    bookmarkedQuestions: (string | number)[];
    selectedId: string | number | null;
    onSelect: (id: string | number) => void;
}

export default function AnalysisNavigator({
    totalQuestions,
    answers,
    questions,
    bookmarkedQuestions,
    selectedId,
    onSelect
}: AnalysisNavigatorProps) {
    return (
        <Card className="h-[calc(100vh-8rem)] sticky top-24">
            <CardBody className="p-0 flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-white z-10">
                    <h3 className="font-bold text-slate-800">Question Navigator</h3>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Correct</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Incorrect</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <span>Unanswered</span>
                        </div>
                    </div>
                </div>

                <ScrollShadow className="flex-1 p-4">
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                        {questions.map((q, index) => {
                            const userAnswer = answers[q.id];
                            const isCorrect = userAnswer === q.correct_answer;
                            const isAnswered = !!userAnswer;
                            const isBookmarked = bookmarkedQuestions.includes(q.id);
                            const isSelected = selectedId === q.id;

                            let bgColor = "bg-slate-100 text-slate-500 hover:bg-slate-200";
                            if (isAnswered) {
                                if (isCorrect) {
                                    bgColor = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
                                } else {
                                    bgColor = "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
                                }
                            }

                            if (isSelected) {
                                bgColor = cn(bgColor, "ring-2 ring-indigo-500 ring-offset-1");
                            }

                            return (
                                <Tooltip
                                    key={q.id}
                                    content={`Question ${index + 1}${isBookmarked ? ' (Bookmarked)' : ''}`}
                                    closeDelay={0}
                                >
                                    <button
                                        onClick={() => onSelect(q.id)}
                                        className={cn(
                                            "aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all relative border border-transparent",
                                            bgColor
                                        ) || ""}
                                    >
                                        {index + 1}
                                        {isBookmarked && (
                                            <div className="absolute -top-1 -right-1 text-amber-500 bg-white rounded-full shadow-sm p-0.5">
                                                <Bookmark size={8} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                </Tooltip>
                            );
                        })}
                    </div>
                </ScrollShadow>
            </CardBody>
        </Card>
    );
}
