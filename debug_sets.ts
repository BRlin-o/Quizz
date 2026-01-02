
import { getQuizSets } from './lib/quiz-data';

async function main() {
    console.log('Fetching quiz sets...');
    const sets = await getQuizSets();
    console.log('Quiz Sets:', JSON.stringify(sets, null, 2));
}

main();
