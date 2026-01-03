
import fs from 'fs';
import path from 'path';

const OUTPUTS_DIR = path.resolve(process.cwd(), '../outputs');

async function migrate() {
    console.log('Starting migration...');

    if (!fs.existsSync(OUTPUTS_DIR)) {
        console.error('Outputs directory not found!');
        return;
    }

    const items = await fs.promises.readdir(OUTPUTS_DIR);

    for (const item of items) {
        if (item.startsWith('.')) continue;

        const examPath = path.join(OUTPUTS_DIR, item);
        const stats = await fs.promises.stat(examPath);

        if (stats.isDirectory()) {
            console.log(`Processing set: ${item}`);
            const files = await fs.promises.readdir(examPath);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(examPath, file);
                    try {
                        const content = await fs.promises.readFile(filePath, 'utf-8');
                        const questions = JSON.parse(content);

                        if (Array.isArray(questions)) {
                            let updated = false;

                            // Determine metadata based on filename/context
                            // Defaults
                            let translationEngine = 'None';
                            if (file.includes('zh') || file.includes('questions_zh')) {
                                translationEngine = 'google';
                            }

                            // We'll use the file creation time or current time if not available
                            // But for this migration we might want to just set a static date or keep what we can find.
                            // Since user asked for "creation time", we can try to get it from file stats if we want, 
                            // but usually these files were just created.
                            // Let's use a standard format ISO string.
                            const fileStats = await fs.promises.stat(filePath);
                            const createdAt = fileStats.birthtime.toISOString(); // Or mtime

                            const newQuestions = questions.map((q: any) => {
                                // Check if we need to update
                                // If fields differ, we mark updated = true
                                // BUT, to avoid noise, let's just overwrite/ensure fields are present.

                                const newQ = { ...q };

                                if (!newQ.created_at) {
                                    newQ.created_at = createdAt; // Or a specific date if known
                                    updated = true;
                                }

                                if (newQ.translation_engine === undefined) {
                                    newQ.translation_engine = translationEngine;
                                    updated = true;
                                }

                                if (!newQ.source) {
                                    newQ.source = '考试宝'; // All current sources are Kaoshibao per user
                                    updated = true;
                                }

                                return newQ;
                            });

                            if (updated) {
                                await fs.promises.writeFile(filePath, JSON.stringify(newQuestions, null, 2));
                                console.log(`Updated ${file} with metadata.`);
                            } else {
                                console.log(`No changes needed for ${file}.`);
                            }
                        }
                    } catch (e) {
                        console.error(`Error processing ${file}:`, e);
                    }
                }
            }
        }
    }
}

migrate();
