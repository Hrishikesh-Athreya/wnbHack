import { useEffect, useState } from "react";
import type { Lead, Agent } from "@/types";

interface CallConnectingProps {
  lead: Lead;
  agent: Agent;
  onComplete: () => void;
}

const steps = [
  { label: "Analyzing lead profile", initialStatus: "completed" },
  { label: "Loading knowledge base", initialStatus: "active" },
  { label: "Establishing connection", initialStatus: "pending" },
  { label: "Agent ready", initialStatus: "pending" },
];

export function CallConnecting({ lead, agent, onComplete }: CallConnectingProps) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Progress through steps
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [onComplete]);

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 font-display">
      {/* Modal Card */}
      <div className="relative w-full max-w-[500px] bg-white dark:bg-[#1a1a2e] rounded-xl shadow-2xl overflow-hidden flex flex-col items-center p-8 transition-colors duration-200">
        {/* Header / Hero Icon */}
        <div className="relative flex items-center justify-center mb-6 mt-4">
          {/* Animated Concentric Circles */}
          <div className="absolute w-32 h-32 bg-primary/10 rounded-full animate-ping-slow opacity-75"></div>
          <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-pulse"></div>
          {/* Main Icon */}
          <div className="relative z-10 flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full text-primary">
            <span className="material-symbols-outlined text-[40px]">phone_in_talk</span>
          </div>
        </div>

        {/* Titles */}
        <div className="text-center mb-8">
          <h1 className="text-[#111118] dark:text-white text-2xl font-bold leading-tight tracking-tight mb-2">
            Connecting Call...
          </h1>
          <p className="text-[#616289] dark:text-slate-400 text-base font-normal">
            {agent.name} is joining
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-8">
          <div className="h-1.5 w-full bg-[#dbdbe6] dark:bg-slate-700 rounded-full overflow-hidden relative">
            {/* Indeterminate Gradient Bar */}
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-indeterminate opacity-80"></div>
            <div className="h-full w-1/3 bg-primary rounded-full absolute top-0 animate-indeterminate"></div>
          </div>
        </div>

        {/* Timeline */}
        <div className="w-full mb-8 px-4">
          <div className="grid grid-cols-[32px_1fr] gap-x-3">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="contents">
                  {/* Icon Column */}
                  <div className="flex flex-col items-center">
                    {status === "completed" && (
                      <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-full p-0.5">
                        <span className="material-symbols-outlined text-[20px] font-bold">check_circle</span>
                      </div>
                    )}
                    {status === "active" && (
                      <div className="text-primary bg-white dark:bg-[#1a1a2e] z-10">
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      </div>
                    )}
                    {status === "pending" && (
                      <div className="text-[#dbdbe6] dark:text-slate-600 bg-white dark:bg-[#1a1a2e] z-10">
                        <span className="material-symbols-outlined text-[20px]">radio_button_unchecked</span>
                      </div>
                    )}
                    {!isLast && (
                      <div className={`w-[2px] h-full min-h-[24px] ${status === "completed" ? "bg-emerald-500/30" : "bg-[#dbdbe6] dark:bg-slate-700"
                        }`}></div>
                    )}
                  </div>

                  {/* Text Column */}
                  <div className={`flex flex-col pb-6 ${status === "pending" ? "opacity-60" : ""}`}>
                    <p className={`text-sm font-medium leading-none mb-1 ${status === "active"
                        ? "text-primary dark:text-indigo-400 font-bold"
                        : "text-[#111118] dark:text-white"
                      }`}>
                      {step.label}
                    </p>
                    <p className={`text-xs font-normal ${status === "completed"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : status === "active"
                          ? "text-[#616289] dark:text-slate-400"
                          : "text-[#616289] dark:text-slate-500"
                      }`}>
                      {status === "completed" ? "Completed" : status === "active" ? "In Progress..." : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full bg-primary/5 dark:bg-primary/10 rounded-lg p-5 mb-6 border border-primary/10 dark:border-primary/20">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="flex flex-col gap-1">
              <p className="text-[#616289] dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">Lead</p>
              <p className="text-[#111118] dark:text-white text-sm font-semibold truncate">
                {lead.name} ({lead.company})
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[#616289] dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">Agent</p>
              <p className="text-primary dark:text-indigo-400 text-sm font-bold truncate">{agent.name}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[#616289] dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">Type</p>
              <p className="text-[#111118] dark:text-white text-sm font-semibold truncate">Discovery Call</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[#616289] dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">Knowledge Loaded</p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-primary dark:text-indigo-400">database</span>
                <p className="text-[#111118] dark:text-white text-sm font-semibold truncate">47 patterns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Action */}
        <button className="flex w-full max-w-[200px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-transparent text-[#616289] hover:text-[#111118] dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold leading-normal tracking-[0.015em] group">
          <span className="group-hover:underline decoration-2 underline-offset-4">Cancel Call</span>
        </button>
      </div>
    </div>
  );
}
