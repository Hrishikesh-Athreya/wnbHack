import React from 'react';
import type { Agent } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentsSidebarProps {
  agents: Agent[];
  onAgentSelect: (agentId: string) => void;
  onDeployAll: () => void;
}

const AgentsSidebar: React.FC<AgentsSidebarProps> = ({ agents, onAgentSelect, onDeployAll }) => {
  const onlineAgents = agents.filter(a => a.status === 'Available').length;

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500';
      case 'On Call':
        return 'bg-yellow-500';
      case 'Learning':
        return 'bg-blue-500';
    }
  };

  const getAvatarColor = (id: string): string => {
    const colors = [
      'from-purple-500 to-purple-700',
      'from-pink-500 to-rose-600',
      'from-blue-500 to-cyan-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-yellow-500',
      'from-cyan-500 to-indigo-700',
      'from-teal-400 to-pink-400',
      'from-rose-400 to-purple-500',
    ];
    const index = parseInt(id.replace(/\D/g, '')) % colors.length;
    return colors[index];
  };

  return (
    <aside className="w-full h-full bg-muted/30 border-r flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Available Agents</h2>
        <Badge className="bg-purple-600">{onlineAgents} online</Badge>
      </div>
      
      <div className="flex-1 space-y-4 mb-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getAvatarColor(agent.id))}>
                    {agent.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-semibold">{agent.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("h-2 w-2 rounded-full", getStatusColor(agent.status))} />
                    <span className="text-xs text-muted-foreground">{agent.status}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onAgentSelect(agent.id)}
                >
                  {agent.selected ? <CheckSquare className="h-4 w-4 text-purple-600" /> : <Square className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex gap-4 p-2 bg-muted/50 rounded-md mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                  <div className="text-sm font-bold">{agent.successRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Calls Today</div>
                  <div className="text-sm font-bold">{agent.callsToday}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {agent.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button 
        onClick={onDeployAll}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold"
        size="lg"
      >
        Deploy All Agents
      </Button>
    </aside>
  );
};

export default AgentsSidebar;
