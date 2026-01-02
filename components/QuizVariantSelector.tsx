"use client";

import { useState } from 'react';
import { QuizVariant } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, Checkbox, CheckboxGroup, Card, CardBody, Input, Tooltip } from "@heroui/react";
import { Play, Dices, RotateCcw } from "lucide-react";

interface QuizVariantSelectorProps {
    slug: string;
    variants: QuizVariant[];
}

export default function QuizVariantSelector({ slug, variants }: QuizVariantSelectorProps) {
    const router = useRouter();
    // Default to selecting all variants
    const [selected, setSelected] = useState<string[]>(variants.map(v => v.filename));
    const [shuffleSeed, setShuffleSeed] = useState<string>("-1");

    const handleStart = () => {
        if (selected.length === 0) return;
        const params = new URLSearchParams();
        params.set('files', selected.join(','));
        // Pass the seed only if it's not -1 (or pass it anyway and handle in backend)
        params.set('shuffle_seed', shuffleSeed);
        router.push(`/quiz/${slug}/play?${params.toString()}`);
    };

    const generateRandomSeed = () => {
        const seed = Math.floor(Math.random() * 1000000).toString();
        setShuffleSeed(seed);
    };

    const resetSeed = () => {
        setShuffleSeed("-1");
    };

    const totalQuestions = variants
        .filter(v => selected.includes(v.filename))
        .reduce((acc, v) => acc + v.questionCount, 0);

    return (
        <Card className="w-full">
            <CardBody className="gap-6 p-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">Select Question Sets</h3>
                    <CheckboxGroup
                        value={selected}
                        onValueChange={(val) => setSelected(val as string[])}
                        color="primary"
                    >
                        {variants.map((v) => (
                            <Checkbox key={v.filename} value={v.filename} classNames={{ label: "w-full" }}>
                                <div className="flex justify-between w-full gap-8">
                                    <span className="font-medium">{v.label}</span>
                                    <span className="text-slate-500 text-sm">{v.questionCount} questions</span>
                                </div>
                            </Checkbox>
                        ))}
                    </CheckboxGroup>
                </div>

                <div className="flex flex-col gap-3 py-4 border-y border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Shuffle Questions</span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            size="sm"
                            placeholder="Seed (-1 for original)"
                            value={shuffleSeed}
                            onValueChange={setShuffleSeed}
                            startContent={<span className="text-slate-400 text-xs">Seed:</span>}
                            className="max-w-[180px]"
                        />
                        <Tooltip content="Randomize Seed">
                            <Button isIconOnly size="sm" variant="flat" onPress={generateRandomSeed} aria-label="Random Seed">
                                <Dices size={18} className="text-indigo-600" />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Reset to Original Order">
                            <Button isIconOnly size="sm" variant="light" onPress={resetSeed} aria-label="Reset Seed">
                                <RotateCcw size={16} className="text-slate-400" />
                            </Button>
                        </Tooltip>
                        {shuffleSeed !== "-1" ? (
                            <span className="text-xs text-green-600 font-medium ml-1">Randomized</span>
                        ) : (
                            <span className="text-xs text-slate-400 font-medium ml-1">Original Order</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-slate-600">
                        Selected: <span className="font-semibold text-indigo-600">{totalQuestions}</span> questions
                    </div>
                    <Button
                        color="primary"
                        endContent={<Play size={16} />}
                        onPress={handleStart}
                        isDisabled={selected.length === 0}
                        className="font-semibold bg-indigo-600 shadow-md shadow-indigo-100"
                    >
                        Start Quiz
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
