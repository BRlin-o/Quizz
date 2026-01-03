'use client';

import { useQuizStore } from '@/store/useQuizStore';
import { Card, CardBody, Button, CircularProgress } from '@heroui/react';
import { Trophy, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function ResultView() {
    const { score, questions, restartQuiz, sessionId } = useQuizStore();
    const params = useParams();
    const slug = params.slug as string;

    const percentage = Math.round((score / questions.length) * 100);

    let message = "Good effort!";
    let color: "primary" | "success" | "warning" | "danger" = "primary";

    if (percentage >= 90) {
        message = "Outstanding!";
        color = "success";
    } else if (percentage >= 70) {
        message = "Great job!";
        color = "primary";
    } else if (percentage >= 50) {
        message = "Good start, keep practicing!";
        color = "warning";
    } else {
        message = "Keep learning!";
        color = "danger";
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <Card className="p-6 text-center shadow-xl">
                    <CardBody className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <CircularProgress
                                classNames={{
                                    svg: "w-32 h-32 drop-shadow-md",
                                    indicator: "stroke-indigo-600",
                                    track: "stroke-slate-100",
                                    value: "text-3xl font-bold text-slate-800",
                                }}
                                value={percentage}
                                showValueLabel={true}
                                size="lg"
                                color={color}
                                aria-label="Score"
                            />
                            {percentage === 100 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 text-yellow-500 bg-white rounded-full p-2 shadow-lg"
                                >
                                    <Trophy size={24} fill="currentColor" />
                                </motion.div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Completed</h2>
                            <p className="text-lg text-slate-600 font-medium">{message}</p>
                            <p className="text-slate-500 mt-1">You scored {score} out of {questions.length}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full mt-4">
                            <Button
                                onPress={restartQuiz}
                                color="primary"
                                variant="shadow"
                                size="lg"
                                startContent={<RefreshCcw size={18} />}
                                className={sessionId ? "col-span-1" : "col-span-2"}
                            >
                                Try Again
                            </Button>

                            {sessionId && (
                                <Button
                                    as={Link}
                                    href={`/quiz/${slug}/analysis/${sessionId}`}
                                    color="secondary"
                                    variant="flat"
                                    size="lg"
                                    startContent={<Trophy size={18} />}
                                >
                                    Analysis
                                </Button>
                            )}

                            <Button
                                as={Link}
                                href={`/quiz/${slug}`}
                                color="default"
                                variant="flat"
                                size="lg"
                                className="col-span-2"
                                startContent={<Home size={18} />}
                            >
                                Back Home
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
}
