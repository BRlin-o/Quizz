'use client';

import { useState, useMemo, useEffect } from 'react';
import { QuizSetGroup, PracticeSession } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Input, Tooltip, Select, SelectItem, RadioGroup, Radio, Checkbox } from "@heroui/react";
import { Play, Dices, RotateCcw, PlayCircle, Trash2 } from "lucide-react";
import { usePracticeStore } from '@/store/usePracticeStore';

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
    const [shuffleOptions, setShuffleOptions] = useState<boolean>(false); // NEW
    const [inProgressSession, setInProgressSession] = useState<PracticeSession | null>(null);

    // Practice store
    const getInProgressSession = usePracticeStore(state => state.getInProgressSession);
    const deleteSession = usePracticeStore(state => state.deleteSession);

    // Get selected group
    const selectedGroup = useMemo(() =>
        groups.find(g => g.id === selectedGroupId) || groups[0],
        [groups, selectedGroupId]);

    // Get sorted variants for filenames
    const sortedVariants = useMemo(() => {
        if (!selectedGroup) return [];
        return [...selectedGroup.variants].sort((a, b) => {
            if (a.language === 'en' || a.label === 'Original') return -1;
            return 1;
        });
    }, [selectedGroup]);

    const filenames = useMemo(() => sortedVariants.map(v => v.filename), [sortedVariants]);

    // Check for in-progress session when settings change
    useEffect(() => {
        if (filenames.length > 0) {
            const session = getInProgressSession(slug, filenames, mode);
            setInProgressSession(session);
        }
    }, [slug, filenames, mode, getInProgressSession]);

    const handleStart = () => {
        if (!selectedGroup) return;

        const params = new URLSearchParams();

        if (mode === 'mixed') {
            params.set('mode', 'mixed');
        } else if (mode === 'translated') {
            params.set('mode', 'translated');
        } else {
            params.set('mode', 'original');
        }

        params.set('files', filenames.join(','));
        params.set('shuffle_seed', shuffleSeed);
        if (shuffleOptions) {
            params.set('shuffle_options', 'true');
        }

        router.push(`/quiz/${slug}/play?${params.toString()}`);
    };

    const handleResume = () => {
        if (!inProgressSession) return;

        const params = new URLSearchParams();
        params.set('mode', inProgressSession.mode);
        params.set('files', inProgressSession.filenames.join(','));
        if (inProgressSession.shuffleSeed) {
            params.set('shuffle_seed', inProgressSession.shuffleSeed);
        }
        params.set('resume', inProgressSession.id);

        router.push(`/quiz/${slug}/play?${params.toString()}`);
    };

    const handleDiscardSession = () => {
        if (inProgressSession) {
            deleteSession(inProgressSession.id);
            setInProgressSession(null);
        }
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

    // Format session progress
    const sessionProgress = inProgressSession
        ? `${Object.keys(inProgressSession.answers).length}/${inProgressSession.totalQuestions}`
        : null;

    return (
        <Card className="w-full">
            <CardBody className="gap-6 p-6">
                {/* Resume In-Progress Session */}
                {inProgressSession && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-amber-800">Continue Previous Session</h4>
                                <p className="text-sm text-amber-600">
                                    Progress: {sessionProgress} answered
                                    {inProgressSession.bookmarkedQuestions.length > 0 && (
                                        <span className="ml-2">• {inProgressSession.bookmarkedQuestions.length} bookmarked</span>
                                    )}
                                </p>
                            </div>
                            <Tooltip content="Discard this session">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={handleDiscardSession}
                                    aria-label="Discard Session"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </Tooltip>
                        </div>
                        <Button
                            color="warning"
                            variant="shadow"
                            fullWidth
                            startContent={<PlayCircle size={18} />}
                            onPress={handleResume}
                            className="font-semibold"
                        >
                            Resume Quiz
                        </Button>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">
                        {inProgressSession ? 'Or Start New Quiz' : 'Quiz Settings'}
                    </h3>

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">Shuffle Options</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">New</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            isSelected={shuffleOptions}
                            onValueChange={setShuffleOptions}
                            size="sm"
                        >
                            <span className="text-sm text-slate-600">Randomize answer order</span>
                        </Checkbox>
                    </div>
                </div>

                <div className="flex flex-col gap-3 py-4 border-b border-slate-100">
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

