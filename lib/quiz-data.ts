import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Question, QuizSet, QuizSetGroup, QuizVariant } from '@/types';

// Points to the sibling 'outputs' directory relative to the project root
const OUTPUTS_DIR = process.env.QUIZ_DATA_PATH
    ? path.resolve(process.cwd(), process.env.QUIZ_DATA_PATH)
    : path.resolve(process.cwd(), '../outputs');

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

                // Scan for JSON files and Group them
                const files = await fs.promises.readdir(examPath);

                // Map base_name -> variants
                // "questions.json" -> base: "questions"
                // "questions_zh.json" -> base: "questions"
                // "questions_part2.json" -> base: "questions_part2"

                const groupMap = new Map<string, QuizVariant[]>();
                const groupInfo = new Map<string, { count: number, label: string }>();

                for (const file of files) {
                    if (file.endsWith('.json')) {
                        try {
                            const content = await fs.promises.readFile(path.join(examPath, file), 'utf-8');
                            const json = JSON.parse(content);

                            if (Array.isArray(json)) {
                                const questionCount = json.length;

                                // Parse filename to identify group and lang
                                // Pattern: {base}_{lang}.json or {base}.json
                                // We can assume if it ends with _{code}, it's a variant.
                                // Known codes: zh, en, etc. Or just look for last underscore.

                                const nameNoExt = file.replace('.json', '');
                                let baseName = nameNoExt;
                                let lang = 'en'; // Default
                                let label = 'Original';

                                // Simple heuristic: check for known suffixes or splitting
                                if (nameNoExt.endsWith('_zh')) {
                                    baseName = nameNoExt.replace('_zh', '');
                                    lang = 'zh';
                                    label = 'Google Translate (ZH)';
                                } else if (nameNoExt.endsWith('_en')) {
                                    baseName = nameNoExt.replace('_en', '');
                                    lang = 'en';
                                    label = 'English';
                                } else {
                                    // Consider it the "original" / base
                                    label = 'Original';
                                }

                                if (!groupMap.has(baseName)) {
                                    groupMap.set(baseName, []);
                                    // Try to generate a nice label for the group
                                    // e.g. "questions" -> "Standard Set"
                                    // "questions_part2" -> "Part 2"
                                    let groupLabel = baseName.replace(/_/g, ' ');
                                    if (groupLabel.toLowerCase() === 'questions') groupLabel = 'Full Question Bank';
                                    else groupLabel = groupLabel.charAt(0).toUpperCase() + groupLabel.slice(1);

                                    groupInfo.set(baseName, { count: questionCount, label: groupLabel });
                                }

                                const variants = groupMap.get(baseName)!;

                                // metadata extraction from first item if possible
                                let metadata = {};
                                if (json.length > 0) {
                                    const first = json[0];
                                    metadata = {
                                        translation_engine: first.translation_engine,
                                        source: first.source,
                                        created_at: first.created_at
                                    };
                                }

                                variants.push({
                                    filename: file,
                                    language: lang,
                                    label: label,
                                    metadata
                                });

                                // Update max count for the group (usually they should match)
                                const info = groupInfo.get(baseName)!;
                                if (questionCount > info.count) info.count = questionCount;
                            }
                        } catch (e) {
                            console.error(`Error parsing ${file} in ${item}:`, e);
                        }
                    }
                }

                // Convert Group Map to Array
                const groups: QuizSetGroup[] = [];
                groupMap.forEach((variants, baseName) => {
                    const info = groupInfo.get(baseName)!;
                    // Sort variants: Original/En first
                    variants.sort((a, b) => {
                        if (a.language === 'en' || a.label === 'Original') return -1;
                        return 1;
                    });

                    groups.push({
                        id: baseName,
                        label: info.label,
                        baseQuestionCount: info.count,
                        variants
                    });
                });

                // Sort groups by name (maybe puts "questions" first)
                groups.sort((a, b) => a.id.localeCompare(b.id));

                if (groups.length > 0) {
                    quizSets.push({
                        slug: item,
                        title,
                        description,
                        tags,
                        readmeContent,
                        groups
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

// mergeTranslations: if true, combines variants into single Question object with 'translations'.
// if false, treats them as separate Question objects (e.g. for Mixed mode where you want 140 questions).
export async function getQuizQuestions(slug: string, filenames: string[], mergeTranslations: boolean = true): Promise<Question[]> {
    const examDir = path.join(OUTPUTS_DIR, slug);

    if (!fs.existsSync(examDir)) {
        throw new Error(`Exam directory not found: ${slug}`);
    }

    // Map of ID -> Question
    // If mergeTranslations is false, we don't use a Map to dedup by ID, we just append.
    // BUT we might still want to dedup if the SAME file is passed twice? Assumed not.
    // For Mixed mode, we likely want "Base" questions + "Translated" questions as separate entries.

    // We'll use a valid list to collect results.
    const allQuestions: Question[] = [];
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
                        const id = item.id;
                        let uniqueId: string | number = id;

                        // If NOT merging, we need to ensure unique IDs if we have duplicates (e.g. 1 from En, 1 from Zh)
                        // If we are appending, we can just append, but React keys/Store might need unique IDs.
                        if (!mergeTranslations) {
                            if (locale !== 'en') {
                                uniqueId = `${id}_${locale}`;
                            }

                            // Create separate question object for this entry
                            allQuestions.push({
                                id: uniqueId,
                                type: item.type || 'multiple-choice',
                                question: item.question,
                                options: item.options,
                                correct_answer: item.correct_answer,
                                analysis: item.analysis || item.explanation || '',
                                translations: {}, // No translations in this mode? Or maybe self-ref?
                                originalIndex: item.id || (index + 1),
                                created_at: item.created_at,
                                source: item.source,
                                translation_engine: item.translation_engine,
                            });
                        } else {
                            // MERGING LOGIC
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
                                    originalIndex: item.id || (index + 1),
                                    created_at: item.created_at,
                                    source: item.source,
                                    translation_engine: item.translation_engine,
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

                            // If base question loaded first (default), we keep it.
                            // If we want to support prioritizing the "current" file's content as main question:
                            // We could update 'question'/'options' here if we wanted strict "View this language" mode while still having translations attached.
                            // But usually "Original" is the canonical base.
                        }
                    });
                }
            } catch (e) {
                console.error(`Error reading questions from ${filename}:`, e);
            }
        }
    }

    if (!mergeTranslations) {
        return allQuestions;
    }

    return Array.from(questionMap.values());
}
