import { Question, QuestionOption, QuestionLocalizedContent } from '@/types';

// Simple seeded random number generator (Linear Congruential Generator)
export function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Generic Fisher-Yates shuffle
 * @param array Array to shuffle
 * @param random Random number generator function (returns 0-1)
 */
export function shuffleArray<T>(array: T[], random: () => number = Math.random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Shuffles questions using a seed if provided
 */
export function shuffleQuestions(questions: Question[], seed?: string | number): Question[] {
    if (!seed || seed === '-1') {
        return questions;
    }

    // Convert string seed to number for the PRNG
    let seedNum = typeof seed === 'string' ? parseInt(seed) : seed;
    if (isNaN(seedNum) && typeof seed === 'string') {
        // If user put text manually in URL
        seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    const random = mulberry32(seedNum);
    return shuffleArray(questions, random);
}

/**
 * Shuffles options for each question IN PLACE.
 * This effectively randomizes the options for each question using Math.random()
 * and updates:
 * 1. The 'options' array order
 * 2. The 'translations' options order (to match)
 * 3. The 'correct_answer' field to point to the new label
 * 4. Relabels all options to A, B, C, D... in their new order
 */
export function shuffleOptionsInPlace(questions: Question[]) {
    // Helper to generate Label char from index (0 -> A, 1 -> B, etc.)
    const getLabelFromIndex = (index: number) => String.fromCharCode(65 + index);

    questions.forEach(q => {
        // 1. Identify valid options
        const originalOptions = q.options;
        if (!originalOptions || originalOptions.length < 2) return;

        // 2. Create an index array [0, 1, 2, 3...] representing original positions
        const indices = originalOptions.map((_, i) => i);

        // 3. Shuffle the indices completely randomly (Math.random)
        shuffleArray(indices, Math.random);

        // 4. Determine the new correct answer label
        // Find the index of the option that matches the current correct_answer
        const originalCorrectIndex = originalOptions.findIndex(o => o.label === q.correct_answer);

        // Find where that index moved to in our shuffled 'indices' array
        // Example: original was at index 1 ('B'). shuffled indices = [2, 0, 3, 1].
        // The original index 1 is now at position 3 in the new array.
        // So the new correct answer label should be the label for position 3 ('D').
        let newCorrectAnswerLabel = q.correct_answer; // Default fallback

        if (originalCorrectIndex !== -1) {
            const newPositionOfCorrectOption = indices.indexOf(originalCorrectIndex);
            if (newPositionOfCorrectOption !== -1) {
                newCorrectAnswerLabel = getLabelFromIndex(newPositionOfCorrectOption);
            }
        }

        // 5. Update the Question structure

        // Rebuild 'options' array based on shuffled indices, but RE-ASSIGN labels
        // The option content moves, but the label (A, B, C...) stays sequential in the UI
        const newOptions: QuestionOption[] = indices.map((originalIndex, newPos) => {
            const originalOpt = originalOptions[originalIndex];
            return {
                ...originalOpt,
                label: getLabelFromIndex(newPos) // Override label to match new position (A, B, C...)
            };
        });

        q.options = newOptions;
        q.correct_answer = newCorrectAnswerLabel;

        // 6. Handle translations if they exist
        // We must shuffle translations in EXACTLY the same way (using the same 'indices' permutation)
        if (q.translations) {
            Object.keys(q.translations).forEach(lang => {
                const transContent = q.translations![lang];
                if (transContent.options && transContent.options.length === originalOptions.length) {
                    const newTransOptions: QuestionOption[] = indices.map((originalIndex, newPos) => {
                        const originalTransOpt = transContent.options[originalIndex];
                        return {
                            ...originalTransOpt,
                            label: getLabelFromIndex(newPos) // Sync label
                        };
                    });
                    transContent.options = newTransOptions;
                }
            });
        }
    });

    return questions;
}
