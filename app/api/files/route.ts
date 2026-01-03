import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Allow reading .md and .txt files from project root and specific subdirs
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.json'];
const BASE_DIR = path.join(process.cwd(), '../'); // NCP-ADS/Claude-Sonnet-4.5/

function getAllFiles(dirPath: string, arrayOfFiles: string[] = [], relativeDir: string = '') {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.join(relativeDir, file);

        // Skip node_modules, .git, .next, etc.
        if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build') {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, relativePath);
        } else {
            if (ALLOWED_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
                arrayOfFiles.push(relativePath);
            }
        }
    });

    return arrayOfFiles;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    // If path is provided, return file content
    if (filePath) {
        try {
            // Security check: ensure path doesn't traverse upwards too far or access restricted areas
            // Simple check: resolve path and ensure it starts with BASE_DIR
            const safePath = path.resolve(BASE_DIR, filePath);
            if (!safePath.startsWith(BASE_DIR)) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
            }

            if (!fs.existsSync(safePath)) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            const content = fs.readFileSync(safePath, 'utf-8');
            return NextResponse.json({ content });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
        }
    }

    // Otherwise list files
    try {
        // We'll just define a set of likely useful directories to scan to avoid scanning the entire hard drive if BASE_DIR is too high
        // Actually BASE_DIR is .../Claude-Sonnet-4.5/ which contains the quiz-app and outputs.
        // Let's just scan the root and 'outputs' and 'docs' if they exist.

        const files: string[] = [];

        // Add root files
        const rootFiles = fs.readdirSync(BASE_DIR).filter(f => !fs.statSync(path.join(BASE_DIR, f)).isDirectory() && ALLOWED_EXTENSIONS.includes(path.extname(f)));
        rootFiles.forEach(f => files.push(f));

        // Add specific dirs of interest
        const dirsToScan = ['outputs', 'docs'];
        dirsToScan.forEach(d => {
            const fullDirPath = path.join(BASE_DIR, d);
            if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
                const subFiles = getAllFiles(fullDirPath, [], d);
                files.push(...subFiles);
            }
        });

        return NextResponse.json({ files });
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}
