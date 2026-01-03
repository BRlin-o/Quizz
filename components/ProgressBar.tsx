'use client';

import { motion } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';

export default function ProgressBar() {
    const { questions, answers, currentIndex } = useQuizStore();

    // Progress based on ANSWERED questions
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="w-full mb-6 flex items-center gap-3">
            {/* Left: Current Question Index */}
            <div className="flex flex-col items-start min-w-[3rem]">
                <span className="text-xl font-bold text-slate-700 leading-none">
                    Q{currentIndex + 1}
                </span>
                {currentQuestion?.originalIndex && (
                    <span className="text-[10px] text-slate-400">
                        #{currentQuestion.originalIndex}
                    </span>
                )}
            </div>

            {/* Right: Progress Bar with Answered Count inside */}
            <div className="flex-1 relative h-5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                        {answeredCount} / {questions.length}
                    </span>
                </div>
            </div>
        </div>
    );
}
