'use client';

import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Switch
} from "@heroui/react";
import { Settings } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";

export default function QuizSettings() {
    const { settings, updateSettings } = useQuizStore();

    return (
        <Popover placement="bottom-end">
            <PopoverTrigger>
                <Button isIconOnly variant="light" aria-label="Settings">
                    <Settings size={22} className="text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4">
                <div className="flex flex-col gap-5 w-72">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Quiz Settings</h3>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">Auto-Advance</span>
                            <span className="text-xs text-slate-500">Next question when correct</span>
                        </div>
                        <Switch
                            size="sm"
                            isSelected={settings.autoAdvance}
                            onValueChange={(val) => updateSettings({ autoAdvance: val })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">Shuffle Options</span>
                            <span className="text-xs text-slate-500">Randomize answer order</span>
                        </div>
                        <Switch
                            size="sm"
                            isSelected={settings.shuffleOptions || false}
                            onValueChange={(val) => updateSettings({ shuffleOptions: val })}
                        />
                    </div>

                    {/* Font Size Control */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">Font Size</span>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => updateSettings({ fontSize: size })}
                                    className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${(settings.fontSize || 'md') === size
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {size === 'sm' ? 'A' : size === 'md' ? 'A+' : size === 'lg' ? 'A++' : 'A+++'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Density Control */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">Layout Density</span>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                            {(['comfortable', 'compact'] as const).map((density) => (
                                <button
                                    key={density}
                                    onClick={() => updateSettings({ density })}
                                    className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${(settings.density || 'comfortable') === density
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {density.charAt(0).toUpperCase() + density.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Layout Width Control */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">Page Width</span>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => updateSettings({ layoutMode: 'centered' })}
                                className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${(settings.layoutMode || 'centered') === 'centered'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Centered
                            </button>
                            <button
                                onClick={() => updateSettings({ layoutMode: 'full' })}
                                className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${settings.layoutMode === 'full'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Full Width
                            </button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
