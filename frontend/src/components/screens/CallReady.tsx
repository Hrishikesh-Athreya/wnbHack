import { useEffect } from "react";
import type { Lead, Agent } from "@/types";

interface CallReadyProps {
  lead: Lead;
  agent: Agent;
  onComplete: () => void;
}

const steps = [
  { label: "Analyzing profile" },
  { label: "Loading knowledge" },
  { label: "Establishing connection" },
  { label: "Agent ready" },
];

export function CallReady({ lead, agent, onComplete }: CallReadyProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="bg-[#f6f8f6] dark:bg-[#102210] font-display flex flex-col min-h-screen">
      {/* Main Container: Full screen centering with blur backdrop */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Background decorative elements */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCarituJt1B0gUCpTp6EaQjuIRaS-3g7KxAT_PsbkcgtZoq1s36zAEL1kJYHaI11A8WJa_QO6Og4mYov_st_4k9CAQWVNKYWnz1-l4b1Ue5Wjdnj9TWmK1XMP8fQBs0OGUoBFh2pocRDunK-1xrUGXMGAS9QyoD5tm81WnDAIZRj1WCb-LxG1jHgZ4VK0jn9EIn02AnQlDPVynNI6n4CKYS8ICrer0m2gZPzJJkfCS4I9aAiHYYfIcoEt_lgyZgmFRkYax10JQRlQ')` }}
        />
        <div className="absolute inset-0 z-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm"></div>

        {/* Central Card */}
        <div className="relative z-10 w-full max-w-[500px] flex flex-col bg-white dark:bg-[#1a2e1a] rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
          {/* Header Section */}
          <div className="flex flex-col items-center pt-10 px-8 pb-6 text-center">
            {/* Large Success Icon */}
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#13ec13]/10 dark:bg-[#13ec13]/20">
              <span className="material-symbols-outlined text-[#13ec13] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            {/* Title & Subtitle */}
            <h1 className="text-3xl font-bold text-[#0fae0f] dark:text-[#13ec13] mb-2">Agent Ready!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              Dialing {lead.name}...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full px-8 mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold text-[#0fae0f] dark:text-[#13ec13]">Processing complete</span>
              <span className="text-xs font-semibold text-[#0fae0f] dark:text-[#13ec13]">100%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#13ec13] w-full rounded-full transition-all duration-500 ease-out"></div>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="px-8 mb-8">
            <div className="grid grid-cols-[32px_1fr] gap-x-3">
              {steps.map((step, index) => (
                <div key={index} className="contents">
                  {/* Step Icon */}
                  <div className="flex flex-col items-center h-full">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#13ec13] text-white">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </div>
                    <div className="w-[2px] bg-[#13ec13] h-full my-1 opacity-30"></div>
                  </div>
                  {/* Step Text */}
                  <div className="pb-6 pt-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{step.label}</p>
                  </div>
                </div>
              ))}

              {/* Call connecting (Active) */}
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#13ec13]/20 animate-pulse">
                  <span
                    className="material-symbols-outlined text-[16px] text-[#0fae0f] dark:text-[#13ec13] animate-bounce"
                    style={{ animationDuration: "1.5s", fontVariationSettings: "'FILL' 1" }}
                  >
                    ring_volume
                  </span>
                </div>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-bold text-[#0fae0f] dark:text-[#13ec13] animate-pulse">
                  Call connecting...
                </p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-8 pb-8">
            {/* Using a very subtle purple background as requested for differentiation */}
            <div className="bg-[#F8F7FF] dark:bg-[#252230] rounded-lg p-5 border border-[#E9E5FF] dark:border-[#383345]">
              <div className="grid grid-cols-[30%_1fr] gap-y-3 gap-x-4 text-sm">
                <div className="text-gray-500 dark:text-gray-400 font-medium">Lead</div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold truncate">
                  {lead.name} ({lead.company})
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">Agent</div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold">{agent.name}</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">Type</div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold">Discovery Call</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">Knowledge</div>
                <div className="text-[#0fae0f] dark:text-[#13ec13] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    database
                  </span>
                  47 patterns loaded
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="px-8 pb-8 flex justify-center">
            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 font-medium text-sm transition-colors py-2 px-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
