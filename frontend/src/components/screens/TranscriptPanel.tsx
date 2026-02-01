import { useRef, useEffect } from "react";

export interface TranscriptMessage {
    id: string;
    speaker: "agent" | "customer";
    text: string;
    timestamp: string;
}

interface TranscriptPanelProps {
    messages: TranscriptMessage[];
    agentName: string;
    isAgentSpeaking?: boolean;
    interimText?: string;
}

export function TranscriptPanel({
    messages,
    agentName,
    isAgentSpeaking,
    interimText,
}: TranscriptPanelProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAgentSpeaking, interimText]);

    return (
        <div className="bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">forum</span>
                    Live Transcript
                </h3>
                <span className="text-xs font-mono text-slate-400">Auto-scroll ON</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex flex-col gap-1 ${message.speaker === "agent" ? "items-end" : "items-start"
                            } max-w-[85%] ${message.speaker === "agent" ? "ml-auto" : ""}`}
                    >
                        <div
                            className={`flex items-center gap-2 mb-0.5 ${message.speaker === "agent" ? "flex-row-reverse" : ""
                                }`}
                        >
                            <span
                                className={`text-xs font-semibold ${message.speaker === "agent"
                                        ? "text-primary"
                                        : "text-slate-500 dark:text-slate-400"
                                    }`}
                            >
                                {message.speaker === "agent" ? agentName : "You"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                                [{message.timestamp}]
                            </span>
                        </div>
                        <div
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${message.speaker === "agent"
                                    ? "bg-primary/10 dark:bg-primary/20 text-slate-800 dark:text-slate-200 rounded-tr-sm"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                                }`}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}

                {/* Agent typing indicator */}
                {isAgentSpeaking && (
                    <div className="flex flex-col gap-1 items-end max-w-[85%] ml-auto">
                        <div className="flex items-center gap-2 flex-row-reverse mb-0.5">
                            <span className="text-xs font-semibold text-primary">{agentName}</span>
                        </div>
                        <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 rounded-2xl rounded-tr-sm">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer interim text (speech-to-text in progress) */}
                {interimText && (
                    <div className="flex flex-col gap-1 items-start max-w-[85%]">
                        <span className="text-xs font-semibold text-slate-400">You (speaking...)</span>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-500 italic">
                            "{interimText}"
                        </div>
                    </div>
                )}

                <div ref={endRef} />
            </div>
        </div>
    );
}
