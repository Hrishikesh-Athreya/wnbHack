import React from "react";
import { Bell, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  agentsOnline: number;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  agentsOnline,
}) => {
  const tabs = [
    "Leads",
    "Active Calls",
    "Knowledge Base",
    "Analytics",
    "Settings",
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            CollectiveSales AI
          </h1>
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange(tab)}
                className={cn(
                  "transition-colors",
                  activeTab === tab &&
                    "bg-purple-100 text-purple-700 hover:bg-purple-200",
                )}
              >
                {tab}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <Badge variant="success" className="gap-2 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {agentsOnline} Agents Online
          </Badge>

          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-400 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
