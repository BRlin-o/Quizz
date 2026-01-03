'use client';

import { useState, useMemo } from 'react';
import { QuizSetGroup } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Input, Tooltip, Select, SelectItem, RadioGroup, Radio } from "@heroui/react";
import { Play, Dices, RotateCcw } from "lucide-react";

interface QuizVariantSelectorProps {
    slug: string;
    groups: QuizSetGroup[];
}

export default function QuizVariantSelector({ slug, groups }: QuizVariantSelectorProps) {
    const router = useRouter();

    // State
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups.length > 0 ? groups[0].id : '');
    const [mode, setMode] = useState<string>("original"); // 'original', 'translated', 'mixed'
    const [shuffleSeed, setShuffleSeed] = useState<string>("-1");

    // Get selected group
    const selectedGroup = useMemo(() =>
        groups.find(g => g.id === selectedGroupId) || groups[0],
        [groups, selectedGroupId]);

    const handleStart = () => {
        if (!selectedGroup) return;

        const params = new URLSearchParams();

        // Determine files based on mode
        let files: string[] = [];

        // We always want to carry the variants if we want to enable switching languages.
        // For 'mixed' mode, we MUST have both.
        // For 'original' or 'translated', if we want to support switching, we need both loaded and merged.
        // If the user strictly wants NO access to translation, we would only send one.
        // But "toggle" feature suggests availability.
        // So we send ALL variants in the group by default.

        // However, we should preserve the ORDER if it matters for the "Base" question.
        // Usually En first.
        const sortedVariants = [...selectedGroup.variants].sort((a, b) => {
            if (a.language === 'en' || a.label === 'Original') return -1;
            return 1;
        });

        files = sortedVariants.map(v => v.filename);

        if (mode === 'mixed') {
            params.set('mode', 'mixed');
        } else if (mode === 'translated') {
            params.set('mode', 'translated');
        } else {
            params.set('mode', 'original');
        }

        params.set('files', files.join(','));
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

    // calculate approximate question count based on mode
    const questionCount = useMemo(() => {
        if (!selectedGroup) return 0;
        if (mode === 'mixed') return selectedGroup.baseQuestionCount * 2;
        return selectedGroup.baseQuestionCount;
    }, [selectedGroup, mode]);

    const hasTranslation = selectedGroup?.variants.some(v => v.language !== 'en');

    return (
        <Card className="w-full">
            <CardBody className="gap-6 p-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">Quiz Settings</h3>

                    <div className="space-y-6">
                        {/* Group Selection */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Question Set</label>
                            <Select
                                selectedKeys={[selectedGroupId]}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                aria-label="Select Question Set"
                                disallowEmptySelection
                            >
                                {groups.map((group) => (
                                    <SelectItem key={group.id} textValue={group.label}>
                                        <div className="flex justify-between items-center w-full gap-2">
                                            <span>{group.label}</span>
                                            <span className="text-xs text-slate-400">({group.baseQuestionCount} Qs)</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        {/* Mode Selection */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Practice Mode</label>
                            <RadioGroup
                                value={mode}
                                onValueChange={setMode}
                                orientation="vertical"
                            >
                                <Radio value="original" description="English (Source)">
                                    Original Only
                                </Radio>
                                <Radio
                                    value="translated"
                                    description="Google Translate (ZH)"
                                    isDisabled={!hasTranslation}
                                >
                                    Translated Only
                                </Radio>
                                <Radio
                                    value="mixed"
                                    description="Both Original & Translated (Double Qs)"
                                    isDisabled={!hasTranslation}
                                >
                                    Mixed Mode
                                </Radio>
                            </RadioGroup>
                        </div>
                    </div>
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
                    </div>
                    {shuffleSeed !== "-1" ? (
                        <span className="text-xs text-green-600 font-medium ml-1">Randomized (Seed: {shuffleSeed})</span>
                    ) : (
                        <span className="text-xs text-slate-400 font-medium ml-1">Original Order</span>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-slate-600">
                        Total: <span className="font-semibold text-indigo-600">{questionCount}</span> questions
                    </div>
                    <Button
                        color="primary"
                        endContent={<Play size={16} />}
                        onPress={handleStart}
                        className="font-semibold bg-indigo-600 shadow-md shadow-indigo-100"
                    >
                        Start Quiz
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
