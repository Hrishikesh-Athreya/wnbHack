/**
 * API service for voice-module backend integration
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface CreateCallRequest {
  room_name?: string;
  expires_in_minutes?: number;
  country?: string;
  industry?: string;
  person_name?: string;
  person_linkedin_url?: string;
  company_name?: string;
  company_website?: string;
}

export interface CreateCallResponse {
  call_id: string;
  room_name: string;
  room_url: string;
  user_token: string;
  status: string;
}

export interface CallStatusResponse {
  call_id: string;
  status: "pending" | "active" | "waiting" | "completed";
  room_name: string | null;
  participants: number;
}

export interface JoinAgentResponse {
  success: boolean;
  message: string;
}

/**
 * Create a new call room
 */
export async function createCall(request: CreateCallRequest): Promise<CreateCallResponse> {
  const response = await fetch(`${API_BASE}/calls/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create call: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current call status
 */
export async function getCallStatus(callId: string): Promise<CallStatusResponse> {
  const response = await fetch(`${API_BASE}/calls/${callId}/status`);

  if (!response.ok) {
    throw new Error(`Failed to get call status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Request AI agent to join the call
 */
export async function joinAgent(callId: string): Promise<JoinAgentResponse> {
  const response = await fetch(`${API_BASE}/calls/${callId}/join-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to join agent: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}
