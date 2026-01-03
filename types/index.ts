export interface QuestionOption {
    label: string;
    text: string;
}

export interface QuestionLocalizedContent {
    question: string;
    options: QuestionOption[];
    analysis?: string;
}

export interface Question {
    id: string | number;
    type: string;
    question: string;
    options: QuestionOption[];
    correct_answer: string;
    analysis?: string;
    translations?: Record<string, QuestionLocalizedContent>;
    originalIndex?: number; // The 1-based index from the source file

    // Metadata
    created_at?: string;
    translation_engine?: 'google' | 'gpt' | 'none' | string;
    source?: string;
}

export interface QuizVariant {
    filename: string; // e.g. "questions_zh.json"
    language: string; // e.g. "zh", "en"
    label: string;    // e.g. "Chinese", "Original"
    metadata?: {
        translation_engine?: string;
        source?: string;
        created_at?: string;
    };
}

export interface QuizSetGroup {
    id: string; // Base identifier, e.g. "questions" or "questions_part2"
    label: string; // Display name, e.g. "Questions 1-70"
    baseQuestionCount: number;
    variants: QuizVariant[]; // helper files, including the base one if needed, or just list available languages
}

export interface QuizSet {
    slug: string;     // e.g. "nvidia-ncp-ads"
    title: string;
    description?: string;
    tags?: string[];
    readmeContent: string; // Raw markdown
    groups: QuizSetGroup[];
}
