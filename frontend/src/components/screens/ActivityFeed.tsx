import type { ActivityItem } from "./conversationFlows";

interface ActivityFeedProps {
    activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    const getActivityStyles = (type: ActivityItem["type"]) => {
        switch (type) {
            case "success":
                return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
            case "warning":
                return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
            case "error":
                return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
            default:
                return "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700";
        }
    };

    const getIconColor = (type: ActivityItem["type"]) => {
        switch (type) {
            case "success":
                return "text-green-600 dark:text-green-400";
            case "warning":
                return "text-yellow-600 dark:text-yellow-400";
            case "error":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-slate-500 dark:text-slate-400";
        }
    };

    return (
        <div className="bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    AI Activity
                </h3>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide">Live</span>
                </div>
            </div>

            {/* Activities */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
                        <p className="text-sm">Waiting for call to start...</p>
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <div
                            key={activity.id}
                            className={`p-3 rounded-lg border ${getActivityStyles(activity.type)} animate-[fadeIn_0.3s_ease-out]`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`material-symbols-outlined ${getIconColor(activity.type)}`}>
                                    {activity.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {activity.text}
                                    </p>
                                    {activity.detail && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {activity.detail}
                                        </p>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                    {activity.timestamp || "Just now"}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
