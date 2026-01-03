
import { Question } from '@/types';
import { shuffleOptionsInPlace } from '@/lib/shuffle';

// Mock Question
const mockQuestion: Question = {
    id: 1,
    type: 'choice',
    question: 'Test Question?',
    correct_answer: 'B', // Correct is "Option 2"
    options: [
        { label: 'A', text: 'Option 1' },
        { label: 'B', text: 'Option 2' }, // CORRECT ONE
        { label: 'C', text: 'Option 3' },
        { label: 'D', text: 'Option 4' }
    ],
    translations: {
        zh: {
            question: 'Test Question ZH?',
            options: [
                { label: 'A', text: 'Option 1 ZH' },
                { label: 'B', text: 'Option 2 ZH' },
                { label: 'C', text: 'Option 3 ZH' },
                { label: 'D', text: 'Option 4 ZH' }
            ]
        }
    }
};

console.log('--- Original ---');
console.log('Correct Answer:', mockQuestion.correct_answer);
console.log('Options:', mockQuestion.options.map(o => `${o.label}: ${o.text}`).join(', '));
console.log('ZH Options:', mockQuestion.translations?.zh.options.map(o => `${o.label}: ${o.text}`).join(', '));

// Shuffle
shuffleOptionsInPlace([mockQuestion]);

console.log('\n--- Shuffled ---');
console.log('Correct Answer:', mockQuestion.correct_answer);
console.log('Options:', mockQuestion.options.map(o => `${o.label}: ${o.text}`).join(', '));
console.log('ZH Options:', mockQuestion.translations?.zh.options.map(o => `${o.label}: ${o.text}`).join(', '));

// Verification Logic
const correctOption = mockQuestion.options.find(o => o.text === 'Option 2');
if (!correctOption) {
    console.error('FAILED: Option 2 missing!');
    process.exit(1);
}

if (mockQuestion.correct_answer !== correctOption.label) {
    console.error(`FAILED: Correct answer mismatch! Expected ${correctOption.label}, got ${mockQuestion.correct_answer}`);
    process.exit(1);
}

const correctZhOption = mockQuestion.translations?.zh.options.find(o => o.text === 'Option 2 ZH');
if (correctZhOption?.label !== mockQuestion.correct_answer) {
    console.error('FAILED: ZH Label sync mismatch!');
    process.exit(1);
}

console.log('\nSUCCESS: Shuffle logic verified.');
