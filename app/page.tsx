import { getQuizSets } from "@/lib/quiz-data";
import QuizList from "@/components/QuizList";

export default async function Home() {
  const quizSets = await getQuizSets();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Quiz Platform</h1>
          <p className="text-slate-500 text-lg">Select a question bank to start practicing</p>
        </header>

        <QuizList quizSets={quizSets} />
      </div>
    </div>
  );
}
