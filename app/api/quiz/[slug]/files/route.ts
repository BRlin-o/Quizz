import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTPUTS_DIR = path.resolve(process.cwd(), '../outputs');

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function GET(request: Request, { params }: PageProps) {
    try {
        const { slug } = await params;
        const quizDir = path.join(OUTPUTS_DIR, slug);

        if (!fs.existsSync(quizDir)) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        const files = fs.readdirSync(quizDir).filter(f => f.endsWith('.json'));
        return NextResponse.json({ files });
    } catch (error) {
        console.error('Error listing quiz files:', error);
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}
