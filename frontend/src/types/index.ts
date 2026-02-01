export type AgentStatus = "Available" | "On Call" | "Learning";

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  successRate: number;
  callsToday: number;
  totalCalls?: number;
  specialties: string[];
  specialty?: string;
  description?: string;
  selected?: boolean;
  recommended?: boolean;
}

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Demo Scheduled" | "Hot" | "Warm" | "Cold";
export type Priority = "high" | "medium" | "low";

export interface Lead {
  id: string;
  name: string;
  company: string;
  industry: string;
  status: LeadStatus;
  dealSize: number;
  lastContact: string;
  priority: Priority;
  bestMatchAgent: {
    agentId: string;
    agentName: string;
    matchScore: number;
  };
  matchScore?: number;
  email?: string;
  phone?: string;
  notes?: string;
  nextAction?: string;
  selected?: boolean;
}

export type CallType = "Discovery Call" | "Follow-up" | "Demo" | "Closing Call";
export type PersonaMode = "Professional" | "Casual" | "Technical Expert";

export interface CallConfig {
  callType: CallType;
  personaMode: PersonaMode;
  enableRealTimeCoaching: boolean;
  autoEscalate: boolean;
}

export interface TranscriptMessage {
  id: string;
  speaker: 'customer' | 'agent';
  text: string;
  timestamp: string;
}

export interface CallSession {
  lead: Lead;
  agent: Agent;
  startTime: Date;
  duration: number;
  transcript: TranscriptMessage[];
  isActive: boolean;
}

export interface ActiveCall {
  callId: string;
  roomUrl: string;
  roomName: string;
  userToken: string;
  lead: Lead;
  agent: Agent;
}

export interface LeadContext {
  previousInteractions: {
    calls: number;
    emails: number;
  };
  mainInterest: string;
  knownObjections: string[];
  buyingSignals: string;
}

