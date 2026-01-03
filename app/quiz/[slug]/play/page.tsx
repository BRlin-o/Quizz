import { getQuizQuestions, getQuizSets } from "@/lib/quiz-data";
import ResumeQuizWrapper from "@/components/ResumeQuizWrapper";
import { notFound, redirect } from "next/navigation";
import { Question } from "@/types";
import { shuffleQuestions, shuffleOptionsInPlace } from "@/lib/shuffle";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        files?: string;
        shuffle_seed?: string;
        shuffle_options?: string;
        mode?: string;
        resume?: string;  // Session ID to resume
    }>;
}

export default async function QuizPlayPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { files, shuffle_seed, shuffle_options, mode, resume } = await searchParams;

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

        // Handle Shuffling (only for new sessions, not resume)
        // When resuming, questions are restored from the session as-is
        if (!resume) {
            // 1. Shuffle Questions (Deterministic with seed)
            if (shuffle_seed && shuffle_seed !== '-1') {
                questions = shuffleQuestions(questions, shuffle_seed);
            }

            // 2. Shuffle Options (Random / Non-deterministic)
            // MOVED TO CLIENT: We no longer shuffle in-place on the server.
            // Instead, we pass the 'shuffle_options' param to the client wrapper.
            // This allows toggling it off to restore the original order provided here.
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
            shuffleOptions={shuffle_options === 'true'}
        />
    );
}

