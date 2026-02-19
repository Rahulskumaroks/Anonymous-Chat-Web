import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id?: string;
  type: "message" | "system";
  username?: string;
  text: string;
  timestamp: number;
};

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

interface UseChatSocketOptions {
  serverUrl: string;
  roomCode: string;
  username: string;
  onError?: (msg: string) => void;
}

interface UseChatSocketReturn {
  messages: ChatMessage[];
  users: string[];
  typingUsers: string[];
  status: ConnectionStatus;
  sendMessage: (text: string) => void;
  sendTyping: () => void;
  disconnect: () => void;
}

export function useChatSocket({
  serverUrl,
  roomCode,
  username,
  onError,
}: UseChatSocketOptions): UseChatSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  // All mutable state lives in refs — avoids stale closures entirely
  const wsRef = useRef<WebSocket | null>(null);
  const intentionalClose = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  const pingInterval = useRef<ReturnType<typeof setInterval>>();
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep latest prop values accessible inside stable callbacks
  const propsRef = useRef({ serverUrl, roomCode, username, onError });
  propsRef.current = { serverUrl, roomCode, username, onError };

  // connectRef holds the connect function so ws.onclose can call it
  // without creating a new closure chain on every call
  const connectRef = useRef<() => void>();

  useEffect(() => {
    intentionalClose.current = false;

    function cleanup(ws: WebSocket) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      clearInterval(pingInterval.current);
    }

    function connect() {
      // Hard-stop if intentional disconnect
      if (intentionalClose.current) return;

      // Tear down existing socket cleanly before making a new one
      if (wsRef.current) {
        cleanup(wsRef.current);
        wsRef.current.close();
        wsRef.current = null;
      }

      const { serverUrl, roomCode, username, onError } = propsRef.current;
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        clearTimeout(statusTimer.current);
        clearTimeout(reconnectTimer.current);
        setStatus("connected");

        ws.send(JSON.stringify({ type: "join", roomCode, username }));

        // Keep-alive
        pingInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25_000);
      };

      ws.onmessage = (event) => {
        let data: any;
        try { data = JSON.parse(event.data); } catch { return; }
        const { username: self } = propsRef.current;

        switch (data.type) {
          case "joined":
            setMessages(data.messages || []);
            setUsers(data.users || []);
            break;
          case "message":
            setMessages((prev) => {
              if (data.id && prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as ChatMessage];
            });
            break;
          case "system":
            setMessages((prev) => [...prev, data as ChatMessage]);
            break;
          case "user-update":
            setUsers(data.users || []);
            break;
          case "typing": {
            const typer = data.username as string;
            if (typer === self) break;
            setTypingUsers((prev) => prev.includes(typer) ? prev : [...prev, typer]);
            const old = typingTimers.current.get(typer);
            if (old) clearTimeout(old);
            const t = setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u !== typer));
              typingTimers.current.delete(typer);
            }, 2500);
            typingTimers.current.set(typer, t);
            break;
          }
          case "messages-expired": {
            const ids = new Set(data.ids as string[]);
            setMessages((prev) => prev.filter((m) => !m.id || !ids.has(m.id)));
            break;
          }
          case "error":
            propsRef.current.onError?.(data.message);
            break;
        }
      };

      ws.onerror = () => { /* close fires right after */ };

      ws.onclose = () => {
        cleanup(ws);
        if (intentionalClose.current) return;

        // Show "reconnecting" only after 1.5s to avoid flash on brief hiccups
        statusTimer.current = setTimeout(() => setStatus("reconnecting"), 1500);

        // Retry after 3s — use connectRef so we don't capture a stale closure
        reconnectTimer.current = setTimeout(() => connectRef.current?.(), 3000);
      };
    }

    // Store in ref so ws.onclose can reach it without stale closure
    connectRef.current = connect;
    connect();

    return () => {
      intentionalClose.current = true;
      clearTimeout(reconnectTimer.current);
      clearTimeout(statusTimer.current);
      clearInterval(pingInterval.current);
      typingTimers.current.forEach(clearTimeout);
      if (wsRef.current) {
        cleanup(wsRef.current);
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // ← empty: runs once. Props accessed via propsRef, never stale.

  function sendMessage(text: string) {
    wsRef.current?.send(JSON.stringify({ type: "message", text }));
  }

  function sendTyping() {
    wsRef.current?.send(JSON.stringify({ type: "typing" }));
  }

  function disconnect() {
    intentionalClose.current = true;
    clearTimeout(reconnectTimer.current);
    clearTimeout(statusTimer.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  return { messages, users, typingUsers, status, sendMessage, sendTyping, disconnect };
}