import React, { useState } from "react";
import type { Lead, Agent, CallType, PersonaMode } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallLaunchModalProps {
  lead: Lead | null;
  agents: Agent[];
  onClose: () => void;
  onLaunchCall: (config: any) => void;
}

const CallLaunchModal: React.FC<CallLaunchModalProps> = ({
  lead,
  agents,
  onClose,
  onLaunchCall,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    lead?.bestMatchAgent.agentId || "",
  );
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [callType, setCallType] = useState<CallType>("Discovery Call");
  const [personaMode, setPersonaMode] = useState<PersonaMode>("Professional");
  const [enableCoaching, setEnableCoaching] = useState(true);
  const [autoEscalate, setAutoEscalate] = useState(true);

  if (!lead) return null;

  const handleLaunch = () => {
    onLaunchCall({
      leadId: lead.id,
      agentId: selectedAgentId,
      multiAgentMode,
      callType,
      personaMode,
      enableCoaching,
      autoEscalate,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Launch Call to {lead.name} ({lead.company})
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Deal Size: {formatCurrency(lead.dealSize)} | Status:{" "}
            <Badge variant="outline" className="ml-1">
              {lead.status}
            </Badge>{" "}
            | Last: {lead.lastContact}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Selection Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Select Agent(s)
            </h3>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!multiAgentMode}
                  onChange={() => setMultiAgentMode(false)}
                  className="w-4 h-4 text-primary accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium">Single agent mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiAgentMode}
                  onChange={(e) => setMultiAgentMode(e.target.checked)}
                  className="w-4 h-4 text-primary accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Multi-agent collaboration (experimental)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {agents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className={cn(
                    "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:shadow-md hover:scale-[1.02]",
                    selectedAgentId === agent.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback
                        className="text-2xl font-bold text-white"
                        style={{ background: getAvatarColor(agent.id) }}
                      >
                        {agent.avatar}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-center w-full">
                      <div className="font-semibold text-sm">{agent.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Success Rate: {agent.successRate}%
                      </div>
                    </div>

                    {agent.id === lead.bestMatchAgent.agentId && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ Recommended
                      </Badge>
                    )}

                    {selectedAgentId === agent.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Call Configuration Section */}
          <section className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-foreground">
              Call Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Call Type
                </label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value as CallType)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option>Discovery Call</option>
                  <option>Follow-up</option>
                  <option>Demo</option>
                  <option>Closing Call</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Persona Mode
                </label>
                <select
                  value={personaMode}
                  onChange={(e) =>
                    setPersonaMode(e.target.value as PersonaMode)
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Technical Expert</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted">
                <span className="text-sm font-medium">
                  Enable Real-Time Coaching
                </span>
                <input
                  type="checkbox"
                  checked={enableCoaching}
                  onChange={(e) => setEnableCoaching(e.target.checked)}
                  className="w-10 h-5 rounded-full appearance-none bg-input checked:bg-primary relative cursor-pointer transition-colors
                            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 
                            before:transition-transform checked:before:translate-x-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted">
                <span className="text-sm font-medium">
                  Auto-Escalate to Human if Stuck
                </span>
                <input
                  type="checkbox"
                  checked={autoEscalate}
                  onChange={(e) => setAutoEscalate(e.target.checked)}
                  className="w-10 h-5 rounded-full appearance-none bg-input checked:bg-primary relative cursor-pointer transition-colors
                            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 
                            before:transition-transform checked:before:translate-x-5"
                />
              </label>
            </div>
          </section>

          {/* Lead Context Section */}
          <section className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-foreground">
              Lead Context
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Previous Interactions
                </div>
                <div className="text-sm font-semibold">2 calls, 3 emails</div>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Main Interest
                </div>
                <div className="text-sm font-semibold">Enterprise features</div>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Known Objections
                </div>
                <div className="text-sm font-semibold">
                  Pricing, Integration timeline
                </div>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Buying Signals
                </div>
                <div className="text-sm font-semibold">
                  High (demo requested)
                </div>
              </div>
            </div>
          </section>

          {/* Quick Prep Section */}
          <section className="space-y-3 pt-4 border-t">
            <h3 className="text-lg font-semibold text-foreground">
              Quick Prep
            </h3>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">
                Relevant Knowledge Available:{" "}
                <span className="font-bold">47 patterns</span>
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  View matching objection responses →
                </a>
                <a
                  href="#"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  See similar won deals →
                </a>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary">Schedule for Later</Button>
          <Button onClick={handleLaunch} className="gap-2">
            <Phone className="w-4 h-4" />
            Start Call Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export default CallLaunchModal;
