'use client';

import { useQuizStore } from '@/store/useQuizStore';
import { Button, ScrollShadow, cn } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
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
        settings // Access settings
    } = useQuizStore();

    const question = questions[currentIndex];
    // Convert question.id (number/string) to string key
    const selectedAnswer = answers[question.id];
    const isAnswered = !!selectedAnswer;
    const isLastQuestion = currentIndex === questions.length - 1;

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
                    <span className="text-slate-700 font-medium leading-relaxed">{textEn}</span>
                    <span className="text-slate-500 text-sm mt-1">{textZh}</span>
                </div>
            );
        }
        return <span className="text-slate-700 font-medium leading-relaxed">{languageMode === 'zh' ? textZh : textEn}</span>;
    };


    // Animation variants
    const variants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

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
                    {/* Scrollable Content Area: Question + Options + Analysis */}
                    <ScrollShadow className="flex-1 px-1">
                        <div className="pb-4">
                            {/* Question Text */}
                            <div className="mb-6">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                                    {renderText('question')}
                                </h2>
                            </div>

                            {/* Options List */}
                            <div className="space-y-3">
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
                                                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start group relative outline-none",
                                                isAnswered ? "cursor-default" : "cursor-pointer hover:border-indigo-300",
                                                // Custom styles based on state
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
                                                {renderOptionContent(option.label)}
                                            </div>
                                            {icon && <span className="ml-2 pt-1">{icon}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Analysis Section (Now inside scroll) */}
                            {isAnswered && (question.analysis || (question.translations?.zh?.analysis)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-sm leading-relaxed"
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
