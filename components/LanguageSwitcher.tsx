'use client';

import { Button, ButtonGroup } from "@heroui/react";

export type LanguageMode = 'en' | 'zh' | 'split';

interface LanguageSwitcherProps {
    currentMode: LanguageMode;
    onModeChange: (mode: LanguageMode) => void;
}

export default function LanguageSwitcher({ currentMode, onModeChange }: LanguageSwitcherProps) {
    return (
        <ButtonGroup variant="flat">
            <Button
                color={currentMode === 'en' ? "primary" : "default"}
                onPress={() => onModeChange('en')}
            >
                EN
            </Button>
            <Button
                color={currentMode === 'zh' ? "primary" : "default"}
                onPress={() => onModeChange('zh')}
            >
                ZH
            </Button>
            <Button
                color={currentMode === 'split' ? "primary" : "default"}
                onPress={() => onModeChange('split')}
            >
                Split
            </Button>
        </ButtonGroup>
    );
}
