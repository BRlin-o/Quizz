'use client';

import { QuizSet } from "@/types";
import { Link } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter, Chip } from "@heroui/react";
import { BookOpen } from "lucide-react";

interface QuizListProps {
    quizSets: QuizSet[];
}

export default function QuizList({ quizSets }: QuizListProps) {
    return (
        <div className="grid md:grid-cols-2 gap-6">
            {quizSets.map((quiz) => {
                const totalQuestions = quiz.groups.reduce((acc, g) => acc + g.baseQuestionCount, 0);

                return (
                    <Link
                        href={`/quiz/${quiz.slug}`}
                        key={quiz.slug}
                        className="block hover:opacity-100"
                    >
                        <Card className="h-full hover:scale-[1.02] transition-transform duration-200 cursor-pointer border-none shadow-md hover:shadow-xl">
                            <CardHeader className="flex gap-4 p-6 bg-white/50 backdrop-blur-sm">
                                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                                    <BookOpen size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1" title={quiz.title}>
                                        {quiz.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {quiz.groups.length} Sets • {totalQuestions} Total Questions
                                    </p>
                                </div>
                            </CardHeader>
                            {quiz.description && (
                                <CardBody className="px-6 py-2">
                                    <p className="text-slate-600 text-sm line-clamp-2">
                                        {quiz.description}
                                    </p>
                                </CardBody>
                            )}
                            {quiz.tags && quiz.tags.length > 0 && (
                                <CardFooter className="px-6 pb-6 pt-2 flex gap-2 flex-wrap">
                                    {quiz.tags.map(tag => (
                                        <Chip key={tag} size="sm" variant="flat" color="primary">
                                            {tag}
                                        </Chip>
                                    ))}
                                </CardFooter>
                            )}
                        </Card>
                    </Link>
                );
            })}

            {quizSets.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <p>No quiz exams found in outputs/ directory.</p>
                </div>
            )}
        </div>
    );
}
