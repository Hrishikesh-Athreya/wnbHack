import { useEffect, useState } from "react";

interface SuccessCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    onStartCall2?: () => void;
    showCall2Button?: boolean;
}

export function SuccessCelebration({
    isOpen,
    onClose,
    onStartCall2,
    showCall2Button = false,
}: SuccessCelebrationProps) {
    const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate confetti pieces
            const colors = ["#6567f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setConfetti(pieces);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map((piece) => (
                    <div
                        key={piece.id}
                        className="absolute w-3 h-3 animate-[fall_3s_ease-in_forwards]"
                        style={{
                            left: `${piece.left}%`,
                            top: "-20px",
                            backgroundColor: piece.color,
                            animationDelay: `${piece.delay}s`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[bounceIn_0.5s_ease-out]">
                {/* Success Icon */}
                <div className="flex flex-col items-center pt-10 pb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                celebration
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center px-8 pb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        🎉 Deal Closed!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        The AI agent successfully closed the deal using collective knowledge from previous calls.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-2xl font-bold text-primary">95%</p>
                            <p className="text-xs text-slate-500">Confidence</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-2xl font-bold text-secondary">4:23</p>
                            <p className="text-xs text-slate-500">Call Duration</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-2xl font-bold text-purple-500">1</p>
                            <p className="text-xs text-slate-500">KB Pattern Used</p>
                        </div>
                    </div>

                    {/* Collective Learning Highlight */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 font-semibold">
                            <span className="material-symbols-outlined">psychology</span>
                            Collective Learning Success!
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Response #1 from Agent Sarah (Call A-1) was used to handle the HIPAA compliance objection.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {showCall2Button && onStartCall2 && (
                            <button
                                onClick={onStartCall2}
                                className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                            >
                                <span className="material-symbols-outlined">call</span>
                                Start Call 2 (with Knowledge)
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Back to Demo
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
