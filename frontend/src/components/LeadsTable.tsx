import React from "react";
import type { Lead } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Search, ChevronDown, Phone, Edit, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsTableProps {
  leads: Lead[];
  onLeadSelect: (leadId: string) => void;
  onCallLead: (lead: Lead) => void;
  selectedTab: string;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onLeadSelect,
  onCallLead,
  selectedTab,
}) => {
  const getStatusClasses = (status: Lead["status"]) => {
    switch (status) {
      case "New":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "Contacted":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "Qualified":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "Demo Scheduled":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    }
  };

  const getPriorityColor = (priority: Lead["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-green-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header Section */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Leads Pipeline
        </h2>
        <div className="flex gap-2">
          {["All Leads", "Hot", "Warm", "Cold", "Contacted"].map((tab) => (
            <button
              key={tab}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search leads by name, company, or status..."
            className="pl-10 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1">
            Industry
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            Deal Size
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            Last Contact
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            Priority
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Lead Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Deal Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Best Match Agent
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={lead.selected}
                    onChange={() => onLeadSelect(lead.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-xs text-gray-500">{lead.company}</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {lead.industry}
                </td>
                <td className="px-4 py-4">
                  <Badge
                    className={cn(
                      "px-2 py-1 text-xs font-medium",
                      getStatusClasses(lead.status),
                    )}
                  >
                    {lead.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                  {formatCurrency(lead.dealSize)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {lead.lastContact}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getPriorityColor(lead.priority),
                      )}
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {lead.priority}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{
                          background: getAvatarColor(
                            lead.bestMatchAgent.agentId,
                          ),
                        }}
                      >
                        {lead.bestMatchAgent.agentId.replace("agent-", "A-")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="text-xs font-medium text-gray-900">
                        {lead.bestMatchAgent.agentName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.bestMatchAgent.matchScore}% match
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                      onClick={() => onCallLead(lead)}
                      title="Launch Call"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="More"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getAvatarColor = (id: string): string => {
  const colors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];
  const index = parseInt(id.replace(/\D/g, "")) % colors.length;
  return colors[index];
};

export default LeadsTable;
