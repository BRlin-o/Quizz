import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to questions.json relative to the project root
// quiz-app is at .../quiz-app
// outputs is at .../outputs
const OUTPUTS_DIR = process.env.QUIZ_DATA_PATH
    ? path.resolve(process.cwd(), process.env.QUIZ_DATA_PATH)
    : path.resolve(process.cwd(), '../outputs');

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const filename = searchParams.get('filename') || 'questions.json';

    try {
        let filePath;
        if (slug) {
            filePath = path.join(OUTPUTS_DIR, slug, filename);
        } else {
            // Fallback for backward compatibility or default listing? 
            // For now let's default to nvidia-ncp-ads if no slug (legacy behavior essentially)
            // or just return error. Let's return error to be strict about usage.
            // Actually, let's keep the hardcoded path as fallback if slug is missing, 
            // OR better yet, let's require slug.
            // But for "Playground" we used a hardcoded path. I should update Playground to correct path if I keep it? 
            // No, I'm refactoring it.
            // Let's default to a known path just in case, but rely on params.
            filePath = path.join(OUTPUTS_DIR, 'nvidia-ncp-ads', 'questions.json');
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Questions file not found' }, { status: 404 });
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const questions = JSON.parse(fileContent);
        return NextResponse.json(questions);
    } catch (error) {
        console.error('Error reading questions:', error);
        return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, type, question, options, correct_answer, analysis, slug, filename, questions: bulkQuestions } = body;

        // Use provided slug/filename or defaults
        const targetSlug = slug || 'nvidia-ncp-ads';
        const targetFilename = filename || 'questions.json';
        const filePath = path.join(OUTPUTS_DIR, targetSlug, targetFilename);

        // Check/Ensure directory exists
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            return NextResponse.json({ error: 'Quiz directory not found' }, { status: 404 });
        }

        // Bulk Save / Save As Handling
        if (bulkQuestions && Array.isArray(bulkQuestions)) {
            fs.writeFileSync(filePath, JSON.stringify(bulkQuestions, null, 2), 'utf-8');
            return NextResponse.json({ success: true, count: bulkQuestions.length });
        }

        if (!id) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]', 'utf-8');
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let questions = JSON.parse(fileContent);

        // Find and update the question
        const index = questions.findIndex((q: any) => q.id === id);
        if (index !== -1) {
            questions[index] = {
                ...questions[index],
                question,
                options,
                correct_answer,
                analysis,
                type,
                // Preserve original fields or update timestamp if needed
                updated_at: new Date().toISOString()
            };
        } else {
            questions.push({
                id,
                type: type || '选择题',
                question,
                options,
                correct_answer,
                analysis,
                created_at: new Date().toISOString(),
                source: 'Playground'
            });
        }

        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');

        return NextResponse.json({ success: true, question: questions[index !== -1 ? index : questions.length - 1] });
    } catch (error) {
        console.error('Error saving question:', error);
        return NextResponse.json({ error: 'Failed to save question' }, { status: 500 });
    }
}
