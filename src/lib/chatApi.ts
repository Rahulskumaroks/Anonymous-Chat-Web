// chatApi.ts — REST calls to your own server (no Supabase edge functions)
// Set VITE_SERVER_URL in your .env, e.g. http://localhost:3001

const BASE_URL = "https://anonymous-chat-service-kken.onrender.com"
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

export async function createRoom(): Promise<{ roomCode: string }> {
  return apiFetch("/api/rooms", { method: "POST" });
}

export async function checkRoom(roomCode: string): Promise<{ exists: boolean; userCount: number }> {
  return apiFetch(`/api/rooms/${roomCode}`);
}