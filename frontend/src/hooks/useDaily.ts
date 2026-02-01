/**
 * Hook for managing Daily.co WebRTC connection
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Daily from "@daily-co/daily-js";
import type {
  DailyCall,
  DailyEvent,
  DailyEventObjectAppMessage,
  DailyEventObjectParticipant,
  DailyParticipant,
} from "@daily-co/daily-js";

export interface DailyTranscriptMessage {
  id: string;
  speaker: "agent" | "customer";
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface UseDailyOptions {
  roomUrl: string;
  token: string;
  onTranscript?: (message: DailyTranscriptMessage) => void;
  onAgentJoined?: () => void;
  onAgentLeft?: () => void;
  onError?: (error: Error) => void;
}

export interface UseDailyReturn {
  isConnected: boolean;
  isAgentConnected: boolean;
  isMuted: boolean;
  participants: DailyParticipant[];
  join: () => Promise<void>;
  leave: () => void;
  toggleMute: () => void;
  sendAppMessage: (data: unknown) => void;
}

export function useDaily({
  roomUrl,
  token,
  onTranscript,
  onAgentJoined,
  onAgentLeft,
  onError,
}: UseDailyOptions): UseDailyReturn {
  const callRef = useRef<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);

  const formatTime = useCallback(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  }, []);

  const handleParticipantJoined = useCallback(
    (event: DailyEventObjectParticipant) => {
      const participant = event.participant;
      setParticipants((prev) => [...prev, participant]);

      // Check if this is the AI agent (typically named "bot" or "agent")
      const userName = participant.user_name?.toLowerCase() || "";
      if (userName.includes("bot") || userName.includes("agent")) {
        setIsAgentConnected(true);
        onAgentJoined?.();
      }
    },
    [onAgentJoined]
  );

  const handleParticipantLeft = useCallback(
    (event: DailyEventObjectParticipant) => {
      const participant = event.participant;
      setParticipants((prev) =>
        prev.filter((p) => p.session_id !== participant.session_id)
      );

      const userName = participant.user_name?.toLowerCase() || "";
      if (userName.includes("bot") || userName.includes("agent")) {
        setIsAgentConnected(false);
        onAgentLeft?.();
      }
    },
    [onAgentLeft]
  );

  const handleAppMessage = useCallback(
    (event: DailyEventObjectAppMessage) => {
      const data = event.data as {
        type?: string;
        text?: string;
        speaker?: string;
        isFinal?: boolean;
      };

      // Handle transcript messages from the agent
      if (data.type === "transcript" && data.text) {
        onTranscript?.({
          id: `transcript-${Date.now()}`,
          speaker: data.speaker === "agent" ? "agent" : "customer",
          text: data.text,
          timestamp: formatTime(),
          isFinal: data.isFinal ?? true,
        });
      }
    },
    [onTranscript, formatTime]
  );

  const join = useCallback(async () => {
    try {
      if (callRef.current) {
        await callRef.current.destroy();
      }

      const call = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
      });

      callRef.current = call;

      // Set up event handlers
      call.on("joined-meeting" as DailyEvent, () => {
        setIsConnected(true);
      });

      call.on("left-meeting" as DailyEvent, () => {
        setIsConnected(false);
        setIsAgentConnected(false);
        setParticipants([]);
      });

      call.on(
        "participant-joined" as DailyEvent,
        handleParticipantJoined as Parameters<DailyCall["on"]>[1]
      );
      call.on(
        "participant-left" as DailyEvent,
        handleParticipantLeft as Parameters<DailyCall["on"]>[1]
      );
      call.on(
        "app-message" as DailyEvent,
        handleAppMessage as Parameters<DailyCall["on"]>[1]
      );

      call.on("error" as DailyEvent, (event) => {
        onError?.(new Error((event as { error?: string }).error || "Daily error"));
      });

      // Join the room
      await call.join({
        url: roomUrl,
        token: token,
        userName: "user",
        startVideoOff: true,
        startAudioOff: false,
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    roomUrl,
    token,
    handleParticipantJoined,
    handleParticipantLeft,
    handleAppMessage,
    onError,
  ]);

  const leave = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    setIsConnected(false);
    setIsAgentConnected(false);
    setParticipants([]);
  }, []);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const sendAppMessage = useCallback((data: unknown) => {
    if (callRef.current) {
      callRef.current.sendAppMessage(data, "*");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, []);

  return {
    isConnected,
    isAgentConnected,
    isMuted,
    participants,
    join,
    leave,
    toggleMute,
    sendAppMessage,
  };
}
