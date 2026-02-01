import { useState } from "react";

interface KnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { topic: string; response: string }) => void;
    defaultTopic?: string;
    defaultQuestion?: string;
}

export function KnowledgeModal({
    isOpen,
    onClose,
    onSave,
    defaultTopic = "HIPAA Compliance",
    defaultQuestion = "Are you HIPAA compliant?",
}: KnowledgeModalProps) {
    const [topic, setTopic] = useState(defaultTopic);
    const [response, setResponse] = useState(
        "Yes, we are fully HIPAA compliant. We have BAA agreements ready, encrypt all data in transit and at rest using AES-256, and our platform is SOC 2 Type II certified."
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onSave({ topic, response });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-[slideUp_0.3s_ease-out]">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-3xl">school</span>
                        <h2 className="text-xl font-bold">Add to Knowledge Base</h2>
                    </div>
                    <p className="text-white/80 text-sm">
                        Help future agents handle this question confidently.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Detection Info */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">
                                lightbulb
                            </span>
                            <div>
                                <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                                    Knowledge Gap Detected
                                </p>
                                <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                                    Customer asked: "{defaultQuestion}"
                                </p>
                                <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                                    Agent confidence was only 35%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Topic Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Topic
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    {/* Response Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Correct Response
                        </label>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Source Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>This will be shared with all agents in your organization.</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-md shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-70"
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-lg">
                                    progress_activity
                                </span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                Save to Knowledge Base
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
