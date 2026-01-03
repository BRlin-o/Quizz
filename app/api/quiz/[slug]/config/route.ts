import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GlobalTranslationSettings } from '@/config/translation';

const OUTPUTS_DIR = process.env.QUIZ_DATA_PATH
    ? path.resolve(process.cwd(), process.env.QUIZ_DATA_PATH)
    : path.resolve(process.cwd(), '../outputs');
const CONFIG_FILENAME = 'translation-config.json';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// GET: Load translation config for a quiz
export async function GET(request: Request, { params }: PageProps) {
    try {
        const { slug } = await params;
        const quizDir = path.join(OUTPUTS_DIR, slug);
        const configPath = path.join(quizDir, CONFIG_FILENAME);

        if (!fs.existsSync(quizDir)) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        if (!fs.existsSync(configPath)) {
            // Return empty object - frontend will merge with defaults
            return NextResponse.json({ config: null });
        }

        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        return NextResponse.json({ config });
    } catch (error) {
        console.error('Error reading quiz config:', error);
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}

// POST: Save translation config for a quiz
export async function POST(request: Request, { params }: PageProps) {
    try {
        const { slug } = await params;
        const quizDir = path.join(OUTPUTS_DIR, slug);
        const configPath = path.join(quizDir, CONFIG_FILENAME);

        if (!fs.existsSync(quizDir)) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        const body = await request.json();
        const settings: GlobalTranslationSettings = body.settings;

        if (!settings) {
            return NextResponse.json({ error: 'Settings required' }, { status: 400 });
        }

        // Write config to file
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');

        return NextResponse.json({ success: true, path: configPath });
    } catch (error) {
        console.error('Error saving quiz config:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
