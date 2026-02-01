import { useState, useCallback, useEffect, useRef } from "react";
import type { Lead, Agent, ActiveCall } from "@/types";
import { TranscriptPanel, type TranscriptMessage } from "./TranscriptPanel";
import { ActivityFeed } from "./ActivityFeed";
import { MicrophoneButton } from "./MicrophoneButton";
import { QuickResponses } from "./QuickResponses";
import { KnowledgeModal } from "./KnowledgeModal";
import { SuccessCelebration } from "./SuccessCelebration";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useDaily, type DailyTranscriptMessage } from "@/hooks/useDaily";
import {
  call1Flow,
  type ConversationStep,
  type ActivityItem,
} from "./conversationFlows";

interface LiveCallProps {
  lead: Lead;
  agent: Agent;
  activeCall?: ActiveCall;
  onEndCall: () => void;
}

export function LiveCall({ lead, agent, activeCall, onEndCall }: LiveCallProps) {
  // Determine if we're using real Daily.co or demo mode
  const isRealCall = Boolean(activeCall?.roomUrl && activeCall?.userToken);
  const [currentFlow] = useState<ConversationStep[]>(call1Flow);
  const [, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [quickResponses, setQuickResponses] = useState<string[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [interimText] = useState("");
  const [duration, setDuration] = useState(0);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(true);
  const [callEnded, setCallEnded] = useState(false);

  const audioPlayer = useAudioPlayer();
  const hasStartedRef = useRef(false);

  // Handle transcript messages from Daily.co
  const handleDailyTranscript = useCallback((msg: DailyTranscriptMessage) => {
    if (msg.isFinal) {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          speaker: msg.speaker,
          text: msg.text,
          timestamp: msg.timestamp,
        },
      ]);
    }
    if (msg.speaker === "agent") {
      setIsAgentSpeaking(!msg.isFinal);
    }
  }, []);

  // Daily.co hook for real WebRTC calls
  const daily = useDaily({
    roomUrl: activeCall?.roomUrl || "",
    token: activeCall?.userToken || "",
    onTranscript: handleDailyTranscript,
    onAgentJoined: () => {
      addActivity({
        id: `act-agent-joined`,
        icon: "person_add",
        text: `${agent.name} has joined the call`,
        type: "success",
        timestamp: "Just now",
      });
      setWaitingForUser(true);
    },
    onAgentLeft: () => {
      addActivity({
        id: `act-agent-left`,
        icon: "person_remove",
        text: `${agent.name} has left the call`,
        type: "warning",
        timestamp: "Just now",
      });
    },
    onError: (error) => {
      console.error("Daily error:", error);
    },
  });

  // Timer effect
  useEffect(() => {
    if (callEnded) return;
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callEnded]);

  // Join Daily room for real calls, or start demo flow
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (isRealCall) {
      // Join the Daily.co room
      daily.join();
    } else {
      // Demo mode: use scripted flow
      setTimeout(() => {
        processStep(call1Flow[0]);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const addMessage = useCallback(
    (speaker: "agent" | "customer", text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          speaker,
          text,
          timestamp: formatDuration(duration),
        },
      ]);
    },
    [duration]
  );

  const addActivity = useCallback((activity: ActivityItem) => {
    setActivities((prev) => [
      {
        ...activity,
        id: `act-${Date.now()}`,
        timestamp: "Just now",
      },
      ...prev.map((a, i) => ({
        ...a,
        timestamp: i === 0 ? "2s ago" : `${(i + 1) * 2}s ago`,
      })),
    ]);
  }, []);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const processStep = useCallback(
    async (step: ConversationStep) => {
      // Add activity if present
      if (step.activity) {
        await delay(step.activityDelay || 300);
        addActivity(step.activity);
      }

      // If agent speaks
      if (step.speaker === "agent" && step.text) {
        setIsAgentSpeaking(true);

        // Try to play audio if available
        if (step.audioFile) {
          try {
            await audioPlayer.play(step.audioFile);
          } catch {
            // Audio not found, simulate with delay
            await delay(Math.min(step.text.length * 50, 3000));
          }
        } else {
          await delay(Math.min(step.text.length * 50, 3000));
        }

        setIsAgentSpeaking(false);
        addMessage("agent", step.text);
      }

      // Check for end conditions
      if (step.isEnd) {
        setCallEnded(true);
        if (step.endType === "escalate") {
          await delay(1000);
          setShowKnowledgeModal(true);
        } else if (step.endType === "success") {
          await delay(1000);
          setShowSuccessModal(true);
        }
        return;
      }

      // Wait for user or auto-advance
      if (step.waitForUser) {
        setWaitingForUser(true);
        setQuickResponses(step.quickResponses || []);
      } else if (step.autoAdvanceDelay) {
        await delay(step.autoAdvanceDelay);
        advanceToNextStep();
      }
    },
    [addActivity, addMessage, audioPlayer]
  );

  const advanceToNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < currentFlow.length) {
        const nextStep = currentFlow[nextIndex];
        processStep(nextStep);
      }
      return nextIndex;
    });
  }, [currentFlow, processStep]);

  const handleUserResponse = useCallback(
    (text: string) => {
      // Add customer message
      addMessage("customer", text);
      setWaitingForUser(false);
      setQuickResponses([]);

      // Small delay then advance
      setTimeout(() => {
        advanceToNextStep();
      }, 500);
    },
    [addMessage, advanceToNextStep]
  );

  const handleEndCall = useCallback(() => {
    audioPlayer.stop();
    // Leave Daily room if connected
    if (isRealCall) {
      daily.leave();
    }
    onEndCall();
  }, [audioPlayer, onEndCall, isRealCall, daily]);

  const handleKnowledgeSave = useCallback(() => {
    setShowKnowledgeModal(false);
    // Return to dashboard after saving knowledge
    setTimeout(() => onEndCall(), 500);
  }, [onEndCall]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e1e2d] shadow-sm z-20 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Live Status */}
          <div className="flex items-center gap-3 w-1/4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <span className="text-slate-900 dark:text-white font-bold tracking-tight text-sm uppercase">
              Live Call
            </span>
          </div>

          {/* Center: Agent & Lead Info */}
          <div className="flex flex-col items-center justify-center w-2/4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">
                {agent.name}
              </span>
              <span className="text-slate-300 dark:text-slate-600">→</span>
              <span>{lead.name}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs">{lead.company}</span>
            </div>
            <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white tracking-wider">
              {formatDuration(duration)}
            </div>
          </div>

          {/* Right: End Call */}
          <div className="flex justify-end w-1/4 gap-3">
            {/* Voice Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Voice
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={voiceModeEnabled}
                  onChange={(e) => setVoiceModeEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-5 rounded-full transition-colors ${voiceModeEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <div
                    className={`absolute w-3 h-3 bg-white rounded-full top-1 transition-transform ${voiceModeEnabled ? "translate-x-4" : "translate-x-1"}`}
                  ></div>
                </div>
              </div>
            </label>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all font-semibold text-sm"
            >
              <span className="material-symbols-outlined text-lg">
                call_end
              </span>
              End Call
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* LEFT PANEL - Transcript */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 h-full">
            {/* Transcript */}
            <div className="flex-1 min-h-0">
              <TranscriptPanel
                messages={messages}
                agentName={agent.name}
                isAgentSpeaking={isAgentSpeaking}
                interimText={interimText}
              />
            </div>

            {/* User Input Area */}
            <div className="bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 shrink-0">
              {waitingForUser ? (
                <div className="space-y-4">
                  {/* Microphone */}
                  {voiceModeEnabled && (
                    <div className="flex justify-center">
                      <MicrophoneButton
                        onTranscript={handleUserResponse}
                        disabled={!waitingForUser}
                      />
                    </div>
                  )}

                  {/* Divider */}
                  {voiceModeEnabled && quickResponses.length > 0 && (
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                      <span className="text-sm text-slate-400 font-medium">
                        OR
                      </span>
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                  )}

                  {/* Quick Responses */}
                  <QuickResponses
                    responses={quickResponses}
                    onSelect={handleUserResponse}
                    disabled={!waitingForUser}
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <span className="material-symbols-outlined text-2xl mb-2 block animate-pulse">
                    {isAgentSpeaking ? "record_voice_over" : "hourglass_empty"}
                  </span>
                  <p className="text-sm">
                    {isAgentSpeaking
                      ? `${agent.name} is speaking...`
                      : "Waiting..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Activity Feed */}
          <div className="col-span-12 lg:col-span-5 h-full">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <KnowledgeModal
        isOpen={showKnowledgeModal}
        onClose={() => {
          setShowKnowledgeModal(false);
          onEndCall();
        }}
        onSave={handleKnowledgeSave}
      />

      <SuccessCelebration
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onEndCall();
        }}
      />
    </div>
  );
}
