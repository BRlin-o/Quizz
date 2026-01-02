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
                <div className="flex flex-col gap-4 w-60">
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
                </div>
            </PopoverContent>
        </Popover>
    );
}
