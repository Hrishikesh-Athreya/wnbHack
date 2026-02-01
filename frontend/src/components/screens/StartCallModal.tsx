import { useState } from "react";
import type { Agent, Lead } from "@/types";

interface StartCallModalProps {
  lead: Lead;
  agents: Agent[];
  onClose: () => void;
  onConfirm: (agentId: string) => void;
}

// Agent avatar URLs for demo
const agentAvatars: Record<string, string> = {
  "1": "https://lh3.googleusercontent.com/aida-public/AB6AXuDbcLQB35HFGWESrP94HF_VbfXonIj5iwADYxTYg3BwyQhq55uRG_pHJ333z7VhRPSW17AXbhFTfH0Q5wKeeNifAgwQyj17zMWdnR01k1Oh0sc3LWSx30R7Rl7nFlq9jCKQ4fxyCfAKKMd4TbsOL-3QxKWpi5OHucqP3qPAx0u33LIvWhvc0XRUfT5eprLkdvlPGGf7M-dOfQZ7kP1pj0uvLlZa6Tyg647t6PItNLHryth1ma92NGFV7GkFkeH81uhs3DttUxe4CA",
  "2": "https://lh3.googleusercontent.com/aida-public/AB6AXuDuh1NM1zNt0TEhkN1nmCwXTH3Q_8hLMi5GAKsFJ4ZSz2aBvoki7tBgrn1L3eC8hwTjtgwQFaMbvTzX3pTfWpBq4EbFw5_AAnxzcRnkik18Y_-hYaLEREY8V6SSGKA5xJr5N5E3Tncmg8J2jUNfs-OathAQ3fUWPOvy6rnjEeeZnVwYlA0svwWqorXH_dPnUliNJoz6skPEZ1RiietjQBzDv4F42H0Mw7zNYLNKgeYQJUxCdyxw34qM42E9PHObbOjuWtzQNSeY1Q",
  "3": "https://lh3.googleusercontent.com/aida-public/AB6AXuCDx1eXcJDqE4fQYU9JPKRdTqvaZULG-zlesIKmC0jfmiIzKHeyETOEei58sADv1jL4dtchUl_UFPz9McDdC-lFMQocxfXmqXLlspvTxiCcC3wtbhk9AAef6XhxAjJ8c1cfbzLl1qv-sE_LUkIkG7QUJNklOSg6_XP2tj4d0Il6KbMn8hd-zgz98Glxe_5DwaJYoqOe7FEOhbrLHbaqHLPwz61-Q92kjoeaQv3e4LuDDLh4vb9O3MH-iBKM0_7aPFjrP0rXVOx2dw",
  "4": "https://lh3.googleusercontent.com/aida-public/AB6AXuC0RbPryQQJNIA_gBHqzTT38daqU7d_1NJSk3q_VoULQtNd6CDYn8AobZPWXAbXXxp7CamRxdzd_muteb8VQ9W_RnKbJS42lZYKs8KiXKkURK20B6XTpckWUsvJ_2Ej-FftG02D_xYMmBVwTEdWZrG8yNb8yYYcDizRrH-PRHXfApuaIZ3zd6i3estXE_IyVojbTGub8ycQ15RZ7o74wV0fliCDHBhHgGkkgbgOtiliApP0OYoqru9qFkqq5EpXfGhMyDBLL1Wg4Q",
};

export function StartCallModal({ lead, agents, onClose, onConfirm }: StartCallModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(
    agents.find(a => a.recommended)?.id || agents[0]?.id || null
  );

  return (
    <div className="font-display bg-background-light dark:bg-background-dark overflow-hidden h-screen w-full">
      {/* Mock Dashboard Background (To provide context for the modal) */}
      <div className="absolute inset-0 z-0 flex h-full w-full overflow-hidden blur-[2px] opacity-60 pointer-events-none select-none">
        {/* Sidebar Mock */}
        <div className="w-64 bg-white dark:bg-[#1e1e2d] border-r border-gray-200 dark:border-gray-700 h-full flex flex-col p-4 gap-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-10 w-full bg-primary/10 rounded"></div>
          <div className="h-10 w-full bg-transparent rounded"></div>
          <div className="h-10 w-full bg-transparent rounded"></div>
        </div>
        {/* Main Content Mock */}
        <div className="flex-1 flex flex-col h-full">
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e2d] w-full"></div>
          <div className="p-8 grid grid-cols-3 gap-6">
            <div className="h-32 bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"></div>
            <div className="h-32 bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"></div>
            <div className="h-32 bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"></div>
            <div className="col-span-3 h-96 bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-4"></div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      <div className="relative z-50 flex items-center justify-center min-h-screen w-full p-4 bg-gray-900/40 backdrop-blur-sm transition-all duration-300 ease-out">
        {/* Modal Container */}
        <div className="w-full max-w-[600px] bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-white dark:bg-[#1e1e2d]">
            <div className="flex flex-col gap-1">
              <h2 className="text-[#111118] dark:text-white text-xl font-bold leading-tight">
                Start Call with {lead.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#616289] text-[18px]">business</span>
                <p className="text-[#616289] text-sm font-medium">{lead.company}</p>
                <span className="text-[#616289] text-xs">•</span>
                <p className="text-[#616289] text-sm font-medium text-green-600 dark:text-green-400">
                  ${lead.dealSize.toLocaleString()} deal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#616289] hover:text-[#111118] dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-[#1e1e2d] space-y-6">
            {/* 1. Select Agent */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[#111118] dark:text-white text-sm font-semibold tracking-wide uppercase opacity-80">
                Select Agent
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {agents.slice(0, 2).map((agent) => {
                  const isSelected = selectedAgent === agent.id;
                  const isRecommended = agent.recommended;

                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className="relative group cursor-pointer"
                    >
                      {/* Recommended Badge */}
                      {isRecommended && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            Recommended <span className="text-[10px]">⭐</span>
                          </span>
                        </div>
                      )}

                      <div className={`flex flex-col gap-3 p-4 rounded-xl transition-all h-full ${isSelected
                          ? "border-2 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                          : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div
                            className="h-10 w-10 rounded-full bg-cover bg-center border border-gray-200"
                            style={{ backgroundImage: `url('${agentAvatars[agent.id] || ""}')` }}
                          />
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isSelected
                              ? "bg-primary text-white"
                              : "border border-gray-300 dark:border-gray-600"
                            }`}>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[#111118] dark:text-white font-bold text-base">{agent.name}</p>
                          <p className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${isSelected ? "text-green-600 dark:text-green-400" : "text-[#616289]"
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            {agent.successRate}% Success Rate
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Call Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111118] dark:text-white text-sm font-semibold tracking-wide uppercase opacity-80">
                Call Objective
              </label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#111118] dark:text-white px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium cursor-pointer">
                  <option>Discovery Call</option>
                  <option>Product Demo</option>
                  <option>Closing Negotiation</option>
                  <option>Follow-up</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#616289]">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            {/* 3. Lead Context */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111118] dark:text-white text-sm font-semibold tracking-wide uppercase opacity-80">
                Lead Context
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                  <span className="material-symbols-outlined text-[14px] mr-1.5">history</span>
                  2 previous calls
                </div>
                <div className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/10">
                  <span className="material-symbols-outlined text-[14px] mr-1.5">laptop_mac</span>
                  Demo requested
                </div>
                <div className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                  <span className="material-symbols-outlined text-[14px] mr-1.5">payments</span>
                  Budget: $50K-100K
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#151520] border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-[#616289] dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedAgent && onConfirm(selectedAgent)}
              disabled={!selectedAgent}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-md shadow-primary/20 flex items-center gap-2 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              Start Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
