import { BASE_URL } from "@/config/config";


export const WS_URL = BASE_URL.replace(/^http/, "ws");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// Room info is now on /v1/chat/rooms/:roomId/info (no auth needed)
export async function checkRoom(roomId: string): Promise<{
  roomId: string;
  name: string;
  visibility: string;
  status: string;
  maxPeople: number;
  currentUsers: number;
  endsAt: string;
}> {
  return apiFetch(`/v1/chat/rooms/${roomId}/info`);
}