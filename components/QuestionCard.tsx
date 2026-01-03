'use client';

import { useQuizStore } from '@/store/useQuizStore';
import { Button, ScrollShadow, cn } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { LanguageMode } from './LanguageSwitcher';
import { Question } from '@/types';

interface QuestionCardProps {
    languageMode: LanguageMode;
}

export default function QuestionCard({ languageMode }: QuestionCardProps) {
    const {
        questions,
        currentIndex,
        answers,
        answerQuestion,
        nextQuestion,
        finishQuiz,
        toggleBookmark,
        bookmarkedQuestions,
        settings // Access settings
    } = useQuizStore();

    const question = questions[currentIndex];
    // Convert question.id (number/string) to string key
    const selectedAnswer = answers[question.id];
    const isAnswered = !!selectedAnswer;
    const isLastQuestion = currentIndex === questions.length - 1;
    const isBookmarked = bookmarkedQuestions.includes(question.id);

    const handleSelect = (optionLabel: string) => {
        if (isAnswered) return;
        answerQuestion(question.id, optionLabel);

        // Auto-advance logic
        if (settings.autoAdvance && optionLabel === question.correct_answer) {
            setTimeout(() => {
                if (!isLastQuestion) {
                    nextQuestion();
                } else {
                    finishQuiz();
                }
            }, 1000); // 1.5s delay for feedback
        }
    };

    const handleNext = () => {
        if (isLastQuestion) {
            finishQuiz();
        } else {
            nextQuestion();
        }
    };

    // Helper to get content based on language
    const getContent = (q: Question, field: 'question' | 'analysis', lang: 'en' | 'zh') => {
        if (lang === 'en') {
            return q.translations?.['en']?.[field] || q[field];
        } else {
            return q.translations?.['zh']?.[field] || (lang === 'zh' ? 'Translation not available' : q[field]);
        }
    };

    const getOptionText = (q: Question, optionLabel: string, lang: 'en' | 'zh') => {
        if (lang === 'en') {
            return q.translations?.['en']?.options.find(o => o.label === optionLabel)?.text || q.options.find(o => o.label === optionLabel)?.text;
        } else {
            return q.translations?.['zh']?.options.find(o => o.label === optionLabel)?.text || 'N/A';
        }
    };

    const renderText = (field: 'question' | 'analysis') => {
        if (languageMode === 'split') {
            return (
                <div className="space-y-2">
                    <div className="text-slate-900">{getContent(question, field, 'en')}</div>
                    <div className="text-slate-500 text-sm font-medium border-t pt-2 mt-2">{getContent(question, field, 'zh')}</div>
                </div>
            );
        }
        return getContent(question, field, languageMode);
    };

    const renderOptionContent = (optionLabel: string) => {
        const textEn = getOptionText(question, optionLabel, 'en');
        const textZh = getOptionText(question, optionLabel, 'zh');

        if (languageMode === 'split') {
            return (
                <div className="flex flex-col">
                    <span>{textEn}</span>
                    <span className="text-slate-500 text-sm mt-1">{textZh}</span>
                </div>
            );
        }
        return <span>{languageMode === 'zh' ? textZh : textEn}</span>;
    };


    // Animation variants
    const variants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    // Style Mappings
    const fontSizes = {
        sm: {
            question: 'text-lg md:text-xl',
            option: 'text-sm',
            analysis: 'text-xs'
        },
        md: {
            question: 'text-xl md:text-2xl',
            option: 'text-base',
            analysis: 'text-sm'
        },
        lg: {
            question: 'text-2xl md:text-3xl',
            option: 'text-lg',
            analysis: 'text-base'
        },
        xl: {
            question: 'text-3xl md:text-4xl',
            option: 'text-xl',
            analysis: 'text-lg'
        }
    };

    const densities = {
        compact: {
            ySpace: 'space-y-2',
            p: 'p-3',
            mb: 'mb-4',
            leading: 'leading-snug'
        },
        comfortable: {
            ySpace: 'space-y-4',
            p: 'p-4',
            mb: 'mb-6',
            leading: 'leading-relaxed'
        }
    };

    const currentFontSize = fontSizes[settings.fontSize || 'md'];
    const currentDensity = densities[settings.density || 'comfortable'];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full"
                >
                    {/* Scrollable Content Area */}
                    <ScrollShadow className="flex-1 px-1">
                        <div className="pb-4">
                            {/* Question Header with Bookmark */}
                            <div className={cn("flex items-start justify-between gap-3", currentDensity.mb)}>
                                <h2 className={cn(
                                    "font-bold text-slate-800 flex-1",
                                    currentFontSize.question,
                                    currentDensity.leading
                                )}>
                                    {renderText('question')}
                                </h2>
                                <button
                                    onClick={() => toggleBookmark(question.id)}
                                    className={cn(
                                        "flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-110",
                                        isBookmarked
                                            ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                            : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                    )}
                                    title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                                >
                                    {isBookmarked ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
                                </button>
                            </div>

                            {/* Options List */}
                            <div className={currentDensity.ySpace}>
                                {question.options.map((option) => {
                                    const isSelected = selectedAnswer === option.label;
                                    const isCorrect = option.label === question.correct_answer;

                                    let icon = null;

                                    if (isAnswered) {
                                        if (isSelected && isCorrect) {
                                            icon = <CheckCircle2 size={20} />;
                                        } else if (isSelected && !isCorrect) {
                                            icon = <XCircle size={20} />;
                                        } else if (isCorrect) {
                                            icon = <CheckCircle2 size={20} />;
                                        }
                                    }

                                    return (
                                        <button
                                            key={option.label}
                                            onClick={() => handleSelect(option.label)}
                                            disabled={isAnswered}
                                            className={cn(
                                                "w-full text-left rounded-xl border-2 transition-all duration-200 flex items-start group relative outline-none",
                                                currentDensity.p,
                                                isAnswered ? "cursor-default" : "cursor-pointer hover:border-indigo-300",
                                                isSelected && isCorrect ? "bg-green-100 border-green-500" :
                                                    isSelected && !isCorrect ? "bg-red-100 border-red-500" :
                                                        !isSelected && isCorrect && isAnswered ? "bg-green-50 border-green-400 border-dashed" :
                                                            "bg-white border-slate-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg mr-4 font-bold text-sm transition-colors border",
                                                isSelected && isCorrect ? "bg-green-200 border-green-300 text-green-800" :
                                                    isSelected && !isCorrect ? "bg-red-200 border-red-300 text-red-800" :
                                                        "bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-slate-200"
                                            )}>
                                                {option.label}
                                            </span>
                                            <div className="flex-1 pt-1">
                                                <div className={cn("font-medium", currentFontSize.option, currentDensity.leading, "text-slate-700")}>
                                                    {renderOptionContent(option.label)}
                                                </div>
                                            </div>
                                            {icon && <span className="ml-2 pt-1">{icon}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Analysis Section */}
                            {isAnswered && (question.analysis || (question.translations?.zh?.analysis)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "mt-6 bg-blue-50 border border-blue-100 rounded-xl text-blue-900",
                                        currentDensity.p,
                                        currentFontSize.analysis,
                                        currentDensity.leading
                                    )}
                                >
                                    <span className="font-bold block mb-1">Analysis:</span>
                                    {renderText('analysis')}
                                </motion.div>
                            )}
                        </div>
                    </ScrollShadow>

                    {/* Fixed Bottom Action Bar */}
                    <div className="pt-4 mt-auto border-t border-slate-100 bg-white z-10">
                        <Button
                            color="primary"
                            size="lg"
                            fullWidth
                            isDisabled={!isAnswered}
                            onPress={handleNext}
                            endContent={<ArrowRight size={20} />}
                            className="shadow-lg shadow-indigo-200"
                        >
                            {isLastQuestion ? "Finish Quiz" : "Next Question"}
                        </Button>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
