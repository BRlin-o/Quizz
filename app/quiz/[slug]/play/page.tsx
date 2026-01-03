import { getQuizQuestions, getQuizSets } from "@/lib/quiz-data";
import ResumeQuizWrapper from "@/components/ResumeQuizWrapper";
import { notFound, redirect } from "next/navigation";
import { Question } from "@/types";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        files?: string;
        shuffle_seed?: string;
        mode?: string;
        resume?: string;  // Session ID to resume
    }>;
}

// Simple seeded random number generator (Linear Congruential Generator)
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export default async function QuizPlayPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { files, shuffle_seed, mode, resume } = await searchParams;

    if (!files) {
        redirect(`/quiz/${slug}`);
    }

    const filenames = files.split(',').filter(Boolean);

    // Fetch quiz set metadata to get a nice title
    const quizSets = await getQuizSets();
    const quizSet = quizSets.find(q => q.slug === slug);

    if (!quizSet) {
        notFound();
    }

    let questions: Question[] = [];

    // If mode is 'mixed', we do NOT merge translations (we want separate items).
    // Otherwise (original/translated), we merge them so we can toggle.
    const mergeTranslations = mode !== 'mixed';

    try {
        questions = await getQuizQuestions(slug, filenames, mergeTranslations);

        // Handle Seeded Shuffle (only for new sessions, not resume)
        // When resuming, questions are restored from the session
        if (!resume) {
            const seedStr = shuffle_seed;
            // Check if seed is provided and NOT '-1'
            if (seedStr && seedStr !== '-1') {
                // Convert string seed to number for the PRNG
                let seedNum = parseInt(seedStr);
                if (isNaN(seedNum)) {
                    // If user put text manually in URL
                    seedNum = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                }

                const random = mulberry32(seedNum);

                // Fisher-Yates shuffle with seeded random
                for (let i = questions.length - 1; i > 0; i--) {
                    const j = Math.floor(random() * (i + 1));
                    [questions[i], questions[j]] = [questions[j], questions[i]];
                }
            }
        }
    } catch (error) {
        console.error(error);
        notFound();
    }

    // Construct a title like "NVIDIA NCP-ADS (Standard + ZH)" or just "NVIDIA NCP-ADS"
    const title = quizSet.title;

    return (
        <ResumeQuizWrapper
            questions={questions}
            title={title}
            mode={mode || 'original'}
            quizSlug={slug}
            filenames={filenames}
            shuffleSeed={shuffle_seed}
            resumeSessionId={resume}
        />
    );
}

