'use client';

import { usePracticeStore } from '@/store/usePracticeStore';
import AnalysisBoard from '@/components/analysis/AnalysisBoard';
import { notFound } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { Spinner } from '@heroui/react';

interface PageProps {
    params: Promise<{
        slug: string;
        sessionId: string;
    }>;
}

export default function AnalysisPage({ params }: PageProps) {
    // Correctly unwrap Promise params using React.use()
    const { slug, sessionId } = use(params);
    const getSession = usePracticeStore(state => state.getSession);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = getSession(sessionId);
        setSession(data);
        setLoading(false);
    }, [sessionId, getSession]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" label="Loading analysis..." />
            </div>
        );
    }

    if (!session) {
        notFound();
    }

    return <AnalysisBoard session={session} />;
}
