import { useState } from "react";
import type { Agent, Lead } from "@/types";

interface DashboardScreenProps {
  agents: Agent[];
  leads: Lead[];
  onStartCall: (lead: Lead) => void;
}

// Agent avatar URLs for demo
const agentAvatars: Record<string, string> = {
  "1": "https://lh3.googleusercontent.com/aida-public/AB6AXuDHAVd5Z4Y-awWnsuZXRt5IcEBkPw-mqni3XJgSujtPZdEJIcMG5UZHMunvBbg2keC8TQUDHYNMEMHr4SFg0Ig0HcgaiEKyx4rg1gvXZvsQ45PP_qEHppRrlv4v9bMs--nWoe0n13v5F5kC84PWyXJ8jNvOKI8bLz5Hvg7qrzkbuHZ-apx_hUOMeTvCPbeJAuxde_fsfsVCxnv2QJM5dP-f7Cn62QyOpyCJD-nyF7Z2Xi9EZvY5migo0mvMxR7Rd-z-ZxXfiek9uw",
  "2": "https://lh3.googleusercontent.com/aida-public/AB6AXuCqjdoN8EEzegY4NVkDiwUJTAvVF6I5foCEyfWeKV9uQSDoO6xu1iM62JDWJLqfZyAuhNWFVuKQ8YgDC7itKpSE6mlxff5mn0vlO2DZz_ZCOiWSqD-nkFfPtpc7ONQRvMfaL47zmu4rgMZkUZJTGkSmj2xV69XO3kH5izHoyzp_attq1kp4EF24PECPqxdHaxjl6jBfL7mEn5sByKYkc5BxtXAsSbZUAr7k4t1RchyA8jCHefcY8-6dFE2EvvNs3e5ROiQIj7mSCA",
  "3": "https://lh3.googleusercontent.com/aida-public/AB6AXuCDx1eXcJDqE4fQYU9JPKRdTqvaZULG-zlesIKmC0jfmiIzKHeyETOEei58sADv1jL4dtchUl_UFPz9McDdC-lFMQocxfXmqXLlspvTxiCcC3wtbhk9AAef6XhxAjJ8c1cfbzLl1qv-sE_LUkIkG7QUJNklOSg6_XP2tj4d0Il6KbMn8hd-zgz98Glxe_5DwaJYoqOe7FEOhbrLHbaqHLPwz61-Q92kjoeaQv3e4LuDDLh4vb9O3MH-iBKM0_7aPFjrP0rXVOx2dw",
  "4": "https://lh3.googleusercontent.com/aida-public/AB6AXuC0RbPryQQJNIA_gBHqzTT38daqU7d_1NJSk3q_VoULQtNd6CDYn8AobZPWXAbXXxp7CamRxdzd_muteb8VQ9W_RnKbJS42lZYKs8KiXKkURK20B6XTpckWUsvJ_2Ej-FftG02D_xYMmBVwTEdWZrG8yNb8yYYcDizRrH-PRHXfApuaIZ3zd6i3estXE_IyVojbTGub8ycQ15RZ7o74wV0fliCDHBhHgGkkgbgOtiliApP0OYoqru9qFkqq5EpXfGhMyDBLL1Wg4Q",
};

export function DashboardScreen({ agents, leads, onStartCall }: DashboardScreenProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

  const toggleAgentSelection = (agentId: string) => {
    const newSelection = new Set(selectedAgents);
    if (newSelection.has(agentId)) {
      newSelection.delete(agentId);
    } else {
      newSelection.add(agentId);
    }
    setSelectedAgents(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Warm": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "New": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
      case "Qualified": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-500";
      case "On Call": return "bg-yellow-500";
      default: return "bg-slate-400";
    }
  };

  const onlineAgentsCount = agents.filter(a => a.status === "Available" || a.status === "On Call").length;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex flex-col antialiased">
      {/* Top Navigation Header */}
      <header className="h-16 shrink-0 bg-white dark:bg-[#1e1e2e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-4">
          {/* Logo Icon */}
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">dataset_linked</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="text-primary">SalesMind</span> AI
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <a className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg" href="#">Leads</a>
          <a className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors" href="#">Calls</a>
          <a className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors" href="#">Knowledge</a>
          <a className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors" href="#">Analytics</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{onlineAgentsCount} Agents Online</span>
          </div>
          <button className="flex items-center gap-2 pl-2">
            <div className="h-9 w-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-primary to-purple-600"></div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Agents (35%) */}
        <aside className="w-full md:w-[35%] lg:w-[380px] xl:w-[420px] bg-[#F5F3FF] dark:bg-[#151520] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 relative z-10">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Available Agents ({agents.length})</h2>
              <button className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="group bg-white dark:bg-[#1e1e2e] p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${agentAvatars[agent.id] || ""}')` }}
                      />
                      <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#1e1e2e] ${getAgentStatusColor(agent.status)}`}></span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {agent.specialties[0] || "Sales Specialist"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedAgents.has(agent.id)}
                    onChange={() => toggleAgentSelection(agent.id)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    <span className="font-medium">{agent.successRate}%</span> Success
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                    <span className="font-medium">{agent.callsToday}</span> Calls
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Button Area */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#F5F3FF] via-[#F5F3FF] to-transparent dark:from-[#151520] dark:via-[#151520]">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white dark:hover:text-white font-semibold transition-colors duration-200 shadow-sm bg-white dark:bg-slate-800">
              <span className="material-symbols-outlined">rocket_launch</span>
              Quick Deploy All Agents
            </button>
          </div>
        </aside>

        {/* Right Panel: Leads Pipeline (65%) */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111122] overflow-hidden">
          {/* Header & Filters */}
          <div className="px-8 pt-8 pb-4 shrink-0 border-b border-transparent">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Leads Pipeline</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your {leads.length} active leads.</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <span className="material-symbols-outlined">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Search leads by name, company..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 transition-all outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 w-full lg:w-auto">
                {["All", "Hot", "Warm", "Cold"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilter === filter
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto px-8 pb-8">
            <table className="w-full border-separate border-spacing-y-2">
              <thead className="bg-white dark:bg-[#111122] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 text-left w-12">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Contact</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Match Score</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {leads.map((lead) => {
                  const initials = lead.company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={lead.id} className="bg-white dark:bg-[#1e1e2e] hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm rounded-lg group transition-colors">
                      <td className="py-4 px-4 rounded-l-lg border-y border-l border-slate-100 dark:border-slate-700/50">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
                      </td>
                      <td className="py-4 px-4 border-y border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{lead.company}</div>
                            <div className="text-slate-500 text-xs">{lead.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-y border-slate-100 dark:border-slate-700/50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300 border-y border-slate-100 dark:border-slate-700/50">
                        ${lead.dealSize.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-700/50">
                        {lead.lastContact}
                      </td>
                      <td className="py-4 px-4 border-y border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${lead.matchScore}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{lead.matchScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 rounded-r-lg text-right border-y border-r border-slate-100 dark:border-slate-700/50">
                        <button
                          onClick={() => onStartCall(lead)}
                          className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] block">phone_in_talk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-8 flex justify-center">
              <button className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                View all leads <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
