import { useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface MicrophoneButtonProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export function MicrophoneButton({ onTranscript, disabled }: MicrophoneButtonProps) {
    const {
        isListening,
        transcript,
        interimText,
        startListening,
        stopListening,
        isSupported,
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            onTranscript(transcript);
        }
    }, [transcript, onTranscript]);

    // Keyboard shortcut: Spacebar to toggle mic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && !disabled && document.activeElement?.tagName !== "INPUT") {
                e.preventDefault();
                if (isListening) {
                    stopListening();
                } else {
                    startListening();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isListening, disabled, startListening, stopListening]);

    if (!isSupported) {
        return (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                    ⚠️ Speech recognition requires Chrome or Edge browser.
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                    Use the quick response buttons below instead.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <button
                onClick={isListening ? stopListening : startListening}
                disabled={disabled}
                className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isListening
                        ? "bg-red-500 animate-pulse scale-110 shadow-red-500/30"
                        : "bg-primary hover:bg-primary-dark hover:scale-105 shadow-primary/30"
                    }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
                aria-label={isListening ? "Stop listening" : "Start listening"}
            >
                <span className="material-symbols-outlined text-white text-3xl">
                    {isListening ? "mic" : "mic"}
                </span>
            </button>

            <div className="text-center min-h-12">
                {isListening ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-red-500">Listening...</span>
                        </div>
                        {interimText && (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic max-w-xs truncate">
                                "{interimText}"
                            </p>
                        )}
                        {/* Sound wave visualization */}
                        <div className="flex items-end gap-0.5 h-6">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-sound-wave"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Click mic or press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Space</kbd> to speak
                    </p>
                )}
            </div>
        </div>
    );
}
