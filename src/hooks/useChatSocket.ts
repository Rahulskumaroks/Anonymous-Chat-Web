import { useEffect, useRef, useCallback, useState } from "react";

export type MessageReactions = Record<string, string[]>;

export type ChatMessage = {
  type: "message" | "system";
  id?: string;
  username?: string;
  text: string;
  timestamp: number;
  reactions?: MessageReactions;
};

type Status = "connecting" | "connected" | "reconnecting" | "disconnected";

interface UseChatSocketOptions {
  serverUrl: string;
  roomId: string;
  roomCode?: string;
  username: string;
  onError?: (msg: string) => void;
}

export function useChatSocket({ serverUrl, roomId, roomCode, username, onError }: UseChatSocketOptions) {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [users, setUsers]             = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [status, setStatus]           = useState<Status>("connecting");

  const wsRef            = useRef<WebSocket | null>(null);
  const reconnectTimer   = useRef<ReturnType<typeof setTimeout>>();
  const typingTimers     = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const mountedRef       = useRef(true);
  const reconnectAttempt = useRef(0);
  const maxReconnectAttempts = 5;

  const optionsRef = useRef({ serverUrl, roomId, roomCode, username, onError });

  useEffect(() => {
    optionsRef.current = { serverUrl, roomId, roomCode, username, onError };
  }, [serverUrl, roomId, roomCode, username, onError]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const { serverUrl, roomId, roomCode, username, onError } = optionsRef.current;

    if (!serverUrl || !roomId || !username) {
      console.warn('Missing required WebSocket params:', { serverUrl, roomId, username });
      setStatus("disconnected");
      onError?.("Missing required connection parameters");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING ||
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connecting or connected, skipping...');
      return;
    }

    console.log('Connecting to WebSocket:', { serverUrl, roomId, username, hasCode: !!roomCode });

    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttempt.current = 0;
      setStatus("connected");

      ws.send(JSON.stringify({
        type: "join",
        roomId,
        username,
        ...(roomCode ? { roomCode } : {}),
      }));
    };

    ws.onmessage = (event) => {
      let data: any;
      try { data = JSON.parse(event.data); } catch { return; }

      switch (data.type) {
        case "joined":
          setMessages(data.messages || []);
          setUsers(data.users || []);
          break;

        case "message":
        case "system":
          setMessages(prev => [...prev, data]);
          break;

        case "messages-expired":
          setMessages(prev => prev.filter(m => !data.ids.includes(m.id)));
          break;

        case "user-update":
          setUsers(data.users || []);
          break;

        case "typing": {
          const u = data.username;
          if (u === optionsRef.current.username) break;
          setTypingUsers(prev => prev.includes(u) ? prev : [...prev, u]);
          if (typingTimers.current[u]) clearTimeout(typingTimers.current[u]);
          typingTimers.current[u] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(x => x !== u));
          }, 3000);
          break;
        }

        case "reaction-update":
          setMessages(prev =>
            prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m)
          );
          break;

        case "error":
          console.error('❌ WebSocket error:', data.message);
          optionsRef.current.onError?.(data.message);
          break;

        case "pong":
          break;
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket closed:', event.code, event.reason);

      if (!mountedRef.current) return;

      if (reconnectAttempt.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        setStatus("disconnected");
        optionsRef.current.onError?.("Connection lost. Please refresh the page.");
        return;
      }

      setStatus("reconnecting");
      const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 15000);
      console.log(`🔄 Reconnection attempt ${reconnectAttempt.current + 1} in ${delay}ms`);
      reconnectAttempt.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error event:', error);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      console.log('🔌 Cleaning up WebSocket');
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      Object.values(typingTimers.current).forEach(timer => clearTimeout(timer));
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      optionsRef.current.onError?.('Not connected to chat');
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "message", text }));
  }, []);

  const sendTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "typing" }));
  }, []);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "react", messageId, emoji }));
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    mountedRef.current = false;
    clearTimeout(reconnectTimer.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave" }));
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { messages, users, typingUsers, status, sendMessage, sendTyping, sendReaction, disconnect };
}