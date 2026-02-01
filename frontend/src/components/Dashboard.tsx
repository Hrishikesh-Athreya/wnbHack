import React, { useState } from "react";
import Header from "./Header";
import AgentsSidebar from "./AgentsSidebar";
import LeadsTable from "./LeadsTable";
import CallLaunchModal from "./CallLaunchModal";
import type { Agent, Lead } from "../types";
import { Button } from "./ui/button";

// Sample data
const initialAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Agent A-1",
    avatar: "A-1",
    status: "Available",
    successRate: 78,
    callsToday: 12,
    specialties: ["Enterprise", "Technical"],
    selected: false,
  },
  {
    id: "agent-2",
    name: "Agent A-2",
    avatar: "A-2",
    status: "On Call",
    successRate: 85,
    callsToday: 8,
    specialties: ["Fast Close", "Enterprise"],
    selected: false,
  },
  {
    id: "agent-3",
    name: "Agent A-3",
    avatar: "A-3",
    status: "Available",
    successRate: 71,
    callsToday: 15,
    specialties: ["Technical"],
    selected: false,
  },
  {
    id: "agent-4",
    name: "Agent A-4",
    avatar: "A-4",
    status: "Learning",
    successRate: 65,
    callsToday: 3,
    specialties: ["Enterprise"],
    selected: false,
  },
  {
    id: "agent-5",
    name: "Agent A-5",
    avatar: "A-5",
    status: "Available",
    successRate: 82,
    callsToday: 10,
    specialties: ["Fast Close"],
    selected: false,
  },
  {
    id: "agent-6",
    name: "Agent A-6",
    avatar: "A-6",
    status: "Available",
    successRate: 88,
    callsToday: 14,
    specialties: ["Enterprise", "Fast Close"],
    selected: false,
  },
  {
    id: "agent-7",
    name: "Agent A-7",
    avatar: "A-7",
    status: "Available",
    successRate: 76,
    callsToday: 9,
    specialties: ["Technical"],
    selected: false,
  },
  {
    id: "agent-8",
    name: "Agent A-8",
    avatar: "A-8",
    status: "Available",
    successRate: 80,
    callsToday: 11,
    specialties: ["Fast Close"],
    selected: false,
  },
];

const initialLeads: Lead[] = [
  {
    id: "lead-1",
    name: "John Smith",
    company: "TechCorp Inc",
    industry: "Software/SaaS",
    status: "Contacted",
    dealSize: 75000,
    lastContact: "2 hours ago",
    priority: "high",
    bestMatchAgent: {
      agentId: "agent-1",
      agentName: "A-1",
      matchScore: 87,
    },
    selected: false,
  },
  {
    id: "lead-2",
    name: "Sarah Johnson",
    company: "RetailPro",
    industry: "Retail",
    status: "Qualified",
    dealSize: 120000,
    lastContact: "1 day ago",
    priority: "medium",
    bestMatchAgent: {
      agentId: "agent-5",
      agentName: "A-5",
      matchScore: 92,
    },
    selected: false,
  },
  {
    id: "lead-3",
    name: "Michael Chen",
    company: "DataFlow Systems",
    industry: "Technology",
    status: "Demo Scheduled",
    dealSize: 250000,
    lastContact: "3 hours ago",
    priority: "high",
    bestMatchAgent: {
      agentId: "agent-6",
      agentName: "A-6",
      matchScore: 95,
    },
    selected: false,
  },
  {
    id: "lead-4",
    name: "Emily Rodriguez",
    company: "HealthTech Solutions",
    industry: "Healthcare",
    status: "New",
    dealSize: 95000,
    lastContact: "5 days ago",
    priority: "medium",
    bestMatchAgent: {
      agentId: "agent-3",
      agentName: "A-3",
      matchScore: 78,
    },
    selected: false,
  },
  {
    id: "lead-5",
    name: "David Williams",
    company: "FinanceHub",
    industry: "Finance",
    status: "Contacted",
    dealSize: 180000,
    lastContact: "1 hour ago",
    priority: "high",
    bestMatchAgent: {
      agentId: "agent-2",
      agentName: "A-2",
      matchScore: 89,
    },
    selected: false,
  },
  {
    id: "lead-6",
    name: "Lisa Anderson",
    company: "EduLearn Inc",
    industry: "Education",
    status: "Qualified",
    dealSize: 65000,
    lastContact: "2 days ago",
    priority: "low",
    bestMatchAgent: {
      agentId: "agent-7",
      agentName: "A-7",
      matchScore: 82,
    },
    selected: false,
  },
  {
    id: "lead-7",
    name: "Robert Taylor",
    company: "ManufacturePlus",
    industry: "Manufacturing",
    status: "Contacted",
    dealSize: 340000,
    lastContact: "4 hours ago",
    priority: "high",
    bestMatchAgent: {
      agentId: "agent-8",
      agentName: "A-8",
      matchScore: 91,
    },
    selected: false,
  },
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Leads");
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const agentsOnline = agents.filter((a) => a.status === "Available").length;
  const selectedLeadsCount = leads.filter((l) => l.selected).length;

  const handleAgentSelect = (agentId: string) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, selected: !agent.selected } : agent,
      ),
    );
  };

  const handleLeadSelect = (leadId: string) => {
    setLeads(
      leads.map((lead) =>
        lead.id === leadId ? { ...lead, selected: !lead.selected } : lead,
      ),
    );
  };

  const handleCallLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  const handleLaunchCall = (config: any) => {
    console.log("Launching call with config:", config);
    // Here you would implement the actual call launching logic
    alert(`Call launched to ${selectedLead?.name}!`);
    setSelectedLead(null);
  };

  const handleDeployAll = () => {
    console.log("Deploying all agents");
    alert("All agents deployed!");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        agentsOnline={agentsOnline}
      />

      <div className="flex flex-1 overflow-hidden pt-16">
        <div className="w-[30%] min-w-[320px] max-w-[400px] overflow-y-auto">
          <AgentsSidebar
            agents={agents}
            onAgentSelect={handleAgentSelect}
            onDeployAll={handleDeployAll}
          />
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
          <LeadsTable
            leads={leads}
            onLeadSelect={handleLeadSelect}
            onCallLead={handleCallLead}
            selectedTab="All Leads"
          />

          {selectedLeadsCount > 0 && (
            <div className="fixed bottom-0 left-[30%] right-0 bg-background border-t shadow-lg p-4 flex justify-between items-center z-10">
              <span className="font-semibold text-sm">
                {selectedLeadsCount} leads selected
              </span>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Bulk Call
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  Assign Agent
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600">
                  Launch Call Campaign
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLead && (
        <CallLaunchModal
          lead={selectedLead}
          agents={agents}
          onClose={handleCloseModal}
          onLaunchCall={handleLaunchCall}
        />
      )}
    </div>
  );
};

export default Dashboard;
