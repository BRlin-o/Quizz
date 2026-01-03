'use client';

import { Question } from '@/types';
import { Card, CardBody, Chip, Divider, cn } from '@heroui/react';
import { CheckCircle2, XCircle, Bookmark, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisQuestionCardProps {
    question: Question;
    userAnswer?: string;
    isBookmarked: boolean;
    index: number;
}

export default function AnalysisQuestionCard({
    question,
    userAnswer,
    isBookmarked,
    index
}: AnalysisQuestionCardProps) {
    const isCorrect = userAnswer === question.correct_answer;
    const isUnanswered = !userAnswer;

    return (
        <Card className={cn(
            "w-full border-2",
            isCorrect ? "border-green-100" : isUnanswered ? "border-slate-100" : "border-red-50"
        )}>
            <CardBody className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-slate-700">Question {index + 1}</span>
                        {isBookmarked && (
                            <Chip size="sm" color="warning" variant="flat" startContent={<Bookmark size={12} />}>
                                Bookmarked
                            </Chip>
                        )}
                        {!isUnanswered && (
                            <Chip
                                size="sm"
                                color={isCorrect ? "success" : "danger"}
                                variant="flat"
                                startContent={isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            >
                                {isCorrect ? "Correct" : "Incorrect"}
                            </Chip>
                        )}
                        {isUnanswered && (
                            <Chip size="sm" color="default" variant="flat" startContent={<AlertCircle size={12} />}>
                                Unanswered
                            </Chip>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">ID: {question.id}</span>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{question.question}</h3>
                    {question.translations?.zh?.question && (
                        <p className="text-slate-500 text-sm border-l-2 border-slate-200 pl-3">
                            {question.translations.zh.question}
                        </p>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {question.options.map((option) => {
                        const isSelected = userAnswer === option.label;
                        const isActualCorrect = option.label === question.correct_answer;

                        let stateStyles = "border-slate-200 bg-white";
                        if (isActualCorrect) {
                            stateStyles = "border-green-500 bg-green-50 ring-1 ring-green-500";
                        } else if (isSelected && !isCorrect) {
                            stateStyles = "border-red-500 bg-red-50";
                        }

                        return (
                            <div
                                key={option.label}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all flex items-start gap-3",
                                    stateStyles
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border shrink-0",
                                    isActualCorrect
                                        ? "bg-green-500 border-green-500 text-white"
                                        : isSelected && !isCorrect
                                            ? "bg-red-500 border-red-500 text-white"
                                            : "border-slate-300 text-slate-500 bg-white"
                                )}>
                                    {option.label}
                                </div>
                                <div className="flex-1">
                                    <div className={cn(
                                        "text-sm font-medium",
                                        isActualCorrect ? "text-green-800" : isSelected && !isCorrect ? "text-red-800" : "text-slate-700"
                                    )}>
                                        {option.text}
                                    </div>
                                    {question.translations?.zh?.options?.find(o => o.label === option.label)?.text && (
                                        <div className={cn(
                                            "text-xs mt-1",
                                            isActualCorrect ? "text-green-600/80" : isSelected && !isCorrect ? "text-red-600/80" : "text-slate-400"
                                        )}>
                                            {question.translations.zh.options.find(o => o.label === option.label)?.text}
                                        </div>
                                    )}
                                </div>
                                {isActualCorrect && <CheckCircle2 size={18} className="text-green-600 shrink-0" />}
                                {isSelected && !isCorrect && <XCircle size={18} className="text-red-500 shrink-0" />}
                            </div>
                        );
                    })}
                </div>

                <Divider className="my-4" />

                {/* Analysis */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <span>💡 Analysis</span>
                    </h4>
                    <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                        <ReactMarkdown>
                            {question.analysis || "No explanation provided."}
                        </ReactMarkdown>
                        {question.translations?.zh?.analysis && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <ReactMarkdown>
                                    {question.translations.zh.analysis}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
