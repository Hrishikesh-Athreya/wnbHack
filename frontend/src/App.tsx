import { useState, useCallback } from 'react';
import type { Agent, Lead, ActiveCall } from './types';
import { createCall, joinAgent } from './services/api';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { StartCallModal } from './components/screens/StartCallModal';
import { CallConnecting } from './components/screens/CallConnecting';
import { CallReady } from './components/screens/CallReady';
import { LiveCall } from './components/screens/LiveCall';

// Mock data
const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Agent Alpha",
    avatar: "A",
    status: "Available",
    successRate: 78,
    callsToday: 12,
    totalCalls: 245,
    specialties: ["Enterprise", "SaaS"],
    recommended: true,
  },
  {
    id: "2",
    name: "Agent Beta",
    avatar: "B",
    status: "Available",
    successRate: 92,
    callsToday: 8,
    totalCalls: 189,
    specialties: ["SMB", "E-commerce"],
  },
  {
    id: "3",
    name: "Agent Gamma",
    avatar: "G",
    status: "On Call",
    successRate: 65,
    callsToday: 15,
    totalCalls: 312,
    specialties: ["FinTech", "Healthcare"],
  },
  {
    id: "4",
    name: "Agent Delta",
    avatar: "D",
    status: "Available",
    successRate: 82,
    callsToday: 10,
    totalCalls: 276,
    specialties: ["Manufacturing", "Logistics"],
  },
];

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    company: "TechCorp Inc",
    industry: "Technology",
    status: "Hot",
    dealSize: 75000,
    lastContact: "2 hours ago",
    priority: "high",
    matchScore: 85,
    bestMatchAgent: {
      agentId: "1",
      agentName: "Agent Alpha",
      matchScore: 85,
    },
  },
  {
    id: "2",
    name: "Sarah Johnson",
    company: "Acme Corp",
    industry: "Manufacturing",
    status: "Warm",
    dealSize: 120000,
    lastContact: "1 day ago",
    priority: "high",
    matchScore: 92,
    bestMatchAgent: {
      agentId: "4",
      agentName: "Agent Delta",
      matchScore: 92,
    },
  },
  {
    id: "3",
    name: "Michael Chen",
    company: "DataFlow Systems",
    industry: "SaaS",
    status: "New",
    dealSize: 45000,
    lastContact: "3 days ago",
    priority: "medium",
    matchScore: 78,
    bestMatchAgent: {
      agentId: "1",
      agentName: "Agent Alpha",
      matchScore: 78,
    },
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    company: "HealthCare Plus",
    industry: "Healthcare",
    status: "Qualified",
    dealSize: 95000,
    lastContact: "5 hours ago",
    priority: "high",
    matchScore: 88,
    bestMatchAgent: {
      agentId: "3",
      agentName: "Agent Gamma",
      matchScore: 88,
    },
  },
];

type AppState =
  | { screen: 'dashboard' }
  | { screen: 'start-call-modal'; lead: Lead }
  | { screen: 'connecting'; lead: Lead; agent: Agent; activeCall?: ActiveCall }
  | { screen: 'ready'; lead: Lead; agent: Agent; activeCall: ActiveCall }
  | { screen: 'live-call'; lead: Lead; agent: Agent; activeCall: ActiveCall };

function App() {
  const [state, setState] = useState<AppState>({ screen: 'dashboard' });
  const [error, setError] = useState<string | null>(null);

  const handleStartCall = (lead: Lead) => {
    setState({ screen: 'start-call-modal', lead });
  };

  const handleConfirmCall = useCallback(async (agentId: string) => {
    if (state.screen !== 'start-call-modal') return;
    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent) return;
    
    const lead = state.lead;
    setState({ screen: 'connecting', lead, agent });
    setError(null);

    try {
      // Create the call room via API
      const callResponse = await createCall({
        country: 'US',
        industry: lead.industry.toLowerCase(),
        person_name: lead.name,
        company_name: lead.company,
      });

      const activeCall: ActiveCall = {
        callId: callResponse.call_id,
        roomUrl: callResponse.room_url,
        roomName: callResponse.room_name,
        userToken: callResponse.user_token,
        lead,
        agent,
      };

      // Request agent to join
      await joinAgent(callResponse.call_id);

      // Move to ready state with call data
      setState({ screen: 'ready', lead, agent, activeCall });
    } catch (err) {
      console.error('Failed to create call:', err);
      setError(err instanceof Error ? err.message : 'Failed to create call');
      setState({ screen: 'dashboard' });
    }
  }, [state]);

  const handleConnectingComplete = () => {
    if (state.screen !== 'connecting') return;
    if (!state.activeCall) return;
    setState({ screen: 'ready', lead: state.lead, agent: state.agent, activeCall: state.activeCall });
  };

  const handleReadyComplete = () => {
    if (state.screen !== 'ready') return;
    setState({ screen: 'live-call', lead: state.lead, agent: state.agent, activeCall: state.activeCall });
  };

  const handleEndCall = () => {
    setState({ screen: 'dashboard' });
  };

  const handleCloseModal = () => {
    setState({ screen: 'dashboard' });
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {state.screen === 'dashboard' && (
        <DashboardScreen
          agents={mockAgents}
          leads={mockLeads}
          onStartCall={handleStartCall}
        />
      )}

      {state.screen === 'start-call-modal' && (
        <StartCallModal
          lead={state.lead}
          agents={mockAgents}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCall}
        />
      )}

      {state.screen === 'connecting' && (
        <CallConnecting
          lead={state.lead}
          agent={state.agent}
          onComplete={handleConnectingComplete}
        />
      )}

      {state.screen === 'ready' && (
        <CallReady
          lead={state.lead}
          agent={state.agent}
          onComplete={handleReadyComplete}
        />
      )}

      {state.screen === 'live-call' && (
        <LiveCall
          lead={state.lead}
          agent={state.agent}
          activeCall={state.activeCall}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}

export default App;
