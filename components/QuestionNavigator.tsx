'use client';

import { useQuizStore } from '@/store/useQuizStore';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, cn } from '@heroui/react';
import { LayoutGrid, CheckCircle2, XCircle, Circle, Bookmark } from 'lucide-react';

export default function QuestionNavigator() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const questions = useQuizStore(state => state.questions);
    const currentIndex = useQuizStore(state => state.currentIndex);
    const answers = useQuizStore(state => state.answers);
    const bookmarkedQuestions = useQuizStore(state => state.bookmarkedQuestions);
    const jumpToQuestion = useQuizStore(state => state.jumpToQuestion);

    const handleJump = (index: number, onClose: () => void) => {
        jumpToQuestion(index);
        onClose();
    };

    const bookmarkedCount = bookmarkedQuestions.length;

    return (
        <>
            <Button
                isIconOnly
                variant="flat"
                color="primary"
                onPress={onOpen}
                aria-label="Question Navigator"
                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
                <LayoutGrid size={20} />
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                scrollBehavior="inside"
                size="2xl"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Question Navigator
                                <div className="flex gap-3 text-sm font-normal text-slate-500">
                                    <span>{Object.keys(answers).length} of {questions.length} answered</span>
                                    {bookmarkedCount > 0 && (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <Bookmark size={14} /> {bookmarkedCount} bookmarked
                                        </span>
                                    )}
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                                    {questions.map((q, idx) => {
                                        const isCurrent = idx === currentIndex;
                                        const userAnswer = answers[q.id];
                                        const isAnswered = !!userAnswer;
                                        const isCorrect = isAnswered && userAnswer === q.correct_answer;
                                        const isWrong = isAnswered && !isCorrect;
                                        const isBookmarked = bookmarkedQuestions.includes(q.id);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => handleJump(idx, onClose)}
                                                className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 relative",
                                                    isCurrent ? "ring-2 ring-offset-2 ring-indigo-500 border-indigo-500 z-10 scale-110" : "border-transparent",
                                                    !isAnswered && !isCurrent ? "bg-slate-100 text-slate-500 hover:bg-slate-200" :
                                                        isCurrent && !isAnswered ? "bg-white text-indigo-600" :
                                                            isCorrect ? "bg-green-100 text-green-700 border-green-200" :
                                                                isWrong ? "bg-red-100 text-red-700 border-red-200" : ""
                                                )}
                                                title={`Question ${idx + 1}${isBookmarked ? ' (Bookmarked)' : ''}`}
                                            >
                                                {idx + 1}
                                                {isBookmarked && (
                                                    <span className="absolute -top-1 -right-1 text-amber-500">
                                                        <Bookmark size={12} fill="currentColor" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-500 justify-center border-t py-4">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Unanswered</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-200"></div> Correct</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-200"></div> Incorrect</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-indigo-500"></div> Current</div>
                                    <div className="flex items-center gap-2"><Bookmark size={12} className="text-amber-500" fill="currentColor" /> Bookmarked</div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

