import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Question, QuizSet, QuizVariant } from '@/types';

// Points to the sibling 'outputs' directory relative to the project root
const OUTPUTS_DIR = path.resolve(process.cwd(), '../outputs');

export async function getQuizSets(): Promise<QuizSet[]> {
    try {
        if (!fs.existsSync(OUTPUTS_DIR)) {
            console.warn(`Outputs directory not found at: ${OUTPUTS_DIR}`);
            return [];
        }

        const items = await fs.promises.readdir(OUTPUTS_DIR);
        const quizSets: QuizSet[] = [];

        for (const item of items) {
            if (item.startsWith('.')) continue;

            const examPath = path.join(OUTPUTS_DIR, item);
            const stats = await fs.promises.stat(examPath);

            if (stats.isDirectory()) {
                // Look for README.md
                const readmePath = path.join(examPath, 'README.md');
                let title = item;
                let description = '';
                let tags: string[] = [];
                let readmeContent = '';

                if (fs.existsSync(readmePath)) {
                    const fileContent = await fs.promises.readFile(readmePath, 'utf-8');
                    const { data, content } = matter(fileContent);
                    title = data.title || title;
                    description = data.description || '';
                    tags = data.tags || [];
                    readmeContent = content;
                }

                // Look for JSON variants
                const files = await fs.promises.readdir(examPath);
                const variants: QuizVariant[] = [];

                for (const file of files) {
                    if (file.endsWith('.json')) {
                        try {
                            const content = await fs.promises.readFile(path.join(examPath, file), 'utf-8');
                            const json = JSON.parse(content);
                            if (Array.isArray(json)) {
                                variants.push({
                                    filename: file,
                                    label: file.replace('.json', '').replace('questions_', '').replace('questions', 'Standard'),
                                    questionCount: json.length
                                });
                            }
                        } catch (e) {
                            console.error(`Error parsing ${file} in ${item}:`, e);
                        }
                    }
                }

                if (variants.length > 0) {
                    quizSets.push({
                        slug: item,
                        title,
                        description,
                        tags,
                        readmeContent,
                        variants
                    });
                }
            }
        }

        return quizSets;
    } catch (error) {
        console.error('Failed to read quiz sets:', error);
        return [];
    }
}

export async function getQuizQuestions(slug: string, filenames: string[]): Promise<Question[]> {
    const examDir = path.join(OUTPUTS_DIR, slug);

    if (!fs.existsSync(examDir)) {
        throw new Error(`Exam directory not found: ${slug}`);
    }

    // Map of ID -> Question
    const questionMap = new Map<string | number, Question>();

    for (const filename of filenames) {
        const filePath = path.join(examDir, filename);
        if (fs.existsSync(filePath)) {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            try {
                const data = JSON.parse(content);
                // Determine locale from filename (e.g. questions_zh.json -> zh, questions.json -> en)
                let locale = 'en';
                // Improve locale detection logic if needed
                if (filename.includes('_zh')) locale = 'zh';

                if (Array.isArray(data)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.forEach((item: any, index: number) => {
                        // Use raw ID from JSON (e.g. 1, 2, 3) for merging
                        // If ID is missing, fall back to index-based ID but warn
                        const id = item.id;

                        if (!questionMap.has(id)) {
                            // If this is the first time we see this question, create the base object
                            questionMap.set(id, {
                                id: id,
                                type: item.type || 'multiple-choice',
                                question: item.question,
                                options: item.options,
                                correct_answer: item.correct_answer,
                                analysis: item.analysis || item.explanation || '',
                                translations: {},
                                originalIndex: item.id || (index + 1)
                            });
                        }

                        // Add content to translations map
                        const q = questionMap.get(id)!;
                        if (!q.translations) q.translations = {};

                        q.translations[locale] = {
                            question: item.question,
                            options: item.options,
                            analysis: item.analysis || item.explanation || ''
                        };
                    });
                }
            } catch (e) {
                console.error(`Error reading questions from ${filename}:`, e);
            }
        }
    }

    return Array.from(questionMap.values());
}
