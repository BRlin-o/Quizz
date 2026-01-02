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
}

export interface QuizVariant {
    filename: string; // e.g. "questions.json"
    label: string;    // e.g. "questions" or "questions_zh"
    questionCount: number;
}

export interface QuizSet {
    slug: string;     // e.g. "nvidia-ncp-ads"
    title: string;
    description?: string;
    tags?: string[];
    readmeContent: string; // Raw markdown
    variants: QuizVariant[];
}
