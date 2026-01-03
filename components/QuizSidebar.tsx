'use client';

import { QuizSetGroup } from '@/types';
import QuizVariantSelector from '@/components/QuizVariantSelector';
import PracticeHistory from '@/components/PracticeHistory';

interface QuizSidebarProps {
    slug: string;
    groups: QuizSetGroup[];
}

export default function QuizSidebar({ slug, groups }: QuizSidebarProps) {
    return (
        <div className="space-y-4">
            <QuizVariantSelector slug={slug} groups={groups} />
            <PracticeHistory slug={slug} />
        </div>
    );
}
