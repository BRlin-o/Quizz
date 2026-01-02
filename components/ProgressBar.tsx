'use client';

import { motion } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';

export default function ProgressBar() {
    const { currentIndex, questions } = useQuizStore();
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
            <motion.div
                className="h-full bg-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>
    );
}
