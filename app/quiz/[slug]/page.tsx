import { getQuizSets } from "@/lib/quiz-data";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import QuizSidebar from "@/components/QuizSidebar";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function QuizDashboard({ params }: PageProps) {
    const { slug } = await params;
    console.log('Rendering QuizDashboard for slug:', slug);
    const quizSets = await getQuizSets();
    const quiz = quizSets.find(q => q.slug === slug);
    console.log('Found quiz:', quiz ? quiz.slug : 'None');

    if (!quiz) {
        console.log('Quiz not found, returning 404');
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <Link href="/" className="mb-6 text-slate-500 hover:text-slate-900 gap-2 items-center flex inline-flex">
                    <ArrowLeft size={16} /> Back to Quizzes
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - README */}
                    <div className="lg:col-span-2 space-y-8">
                        <header>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
                            {quiz.description && (
                                <p className="text-xl text-slate-500">{quiz.description}</p>
                            )}
                        </header>

                        <div className="prose prose-slate max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <ReactMarkdown>{quiz.readmeContent}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Sidebar - Controls & History */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            <Link href={`/quiz/${quiz.slug}/editor`} className="block group">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group-hover:border-indigo-500 group-hover:shadow-md transition-all flex items-center justify-center gap-2">
                                    <Edit size={18} className="text-slate-500 group-hover:text-indigo-600" />
                                    <span className="font-semibold text-slate-700 group-hover:text-indigo-600">Open Editor</span>
                                </div>
                            </Link>
                            <QuizSidebar slug={quiz.slug} groups={quiz.groups} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

