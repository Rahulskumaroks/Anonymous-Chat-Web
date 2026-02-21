import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { WS_URL } from "@/lib/chatApi";
import { Copy, LogOut, Send, Users, WifiOff, CheckCheck, Circle, ArrowLeft } from "lucide-react";
import { useChatSocket } from "@/hooks/useChatSocket";

const MESSAGE_TTL_MS = 4 * 60 * 1000;
const ALLOWED_EMOJIS = ["👍", "👎", "❤️", "😂", "😮", "😢", "🔥", "🎉"];

function ExpiryBadge({ timestamp }: { timestamp: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => setRemaining(Math.max(0, MESSAGE_TTL_MS - (Date.now() - timestamp)));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [timestamp]);

  if (remaining > 60_000) return null;

  const progress = (remaining / 60_000) * 100;
  const isLow = remaining < 30_000;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="relative w-16 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
            isLow ? "bg-red-500" : "bg-purple-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${isLow ? "text-red-400" : "text-gray-500"}`}>
        {Math.ceil(remaining / 1000)}s
      </span>
    </div>
  );
}

function TypingIndicator({ typingUsers }: { typingUsers: string[] }) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-fade-in">
      <div className="flex gap-1 px-3 py-2 bg-[#1a1a1a] rounded-2xl border border-gray-800">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-gray-500">
        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
      </span>
    </div>
  );
}

function EmojiPicker({
  onSelect,
  isOwn,
}: {
  onSelect: (emoji: string) => void;
  isOwn: boolean;
}) {
  return (
    <div
      className={`absolute -top-10 ${isOwn ? "right-0" : "left-0"} z-20 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#1a1a1a] border border-gray-700 shadow-xl shadow-black/50 animate-fade-in`}
    >
      {ALLOWED_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-base hover:scale-125 transition-transform duration-150 leading-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ReactionBar({
  reactions,
  currentUsername,
  onReact,
}: {
  reactions: Record<string, string[]>;
  currentUsername: string;
  onReact: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {entries.map(([emoji, users]) => {
        const iReacted = users.includes(currentUsername);
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              iReacted
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            <span>{emoji}</span>
            <span className="tabular-nums">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  let state = location.state as { username?: string; room?: any } | null;

  if (!state && roomId) {
    const stored = sessionStorage.getItem(`chat_${roomId}`);
    if (stored) {
      try {
        state = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored chat state:", e);
      }
    }
  }

  const username = state?.username;
  const room = state?.room;
  const roomCode = room?.code as string | undefined;
  const roomName = room?.name || roomId;

  useEffect(() => {
    if (!username || !roomId) navigate("/");
  }, [username, roomId, navigate]);

  useEffect(() => {
    return () => {
      if (roomId) sessionStorage.removeItem(`chat_${roomId}`);
    };
  }, [roomId]);

  if (!username || !roomId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" />
          <p className="text-sm text-gray-400">Loading your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatRoomConnected
      username={username}
      roomId={roomId}
      roomCode={roomCode}
      roomName={roomName}
    />
  );
};

function getRoomIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('chill') || lower.includes('vibes')) return '🎵';
  if (lower.includes('study') || lower.includes('group')) return '📚';
  if (lower.includes('chat') || lower.includes('random')) return '💬';
  if (lower.includes('game') || lower.includes('gaming')) return '🎮';
  if (lower.includes('rock') || lower.includes('music')) return '🎸';
  return '💬';
}

function ChatRoomConnected({
  username,
  roomId,
  roomCode,
  roomName,
}: {
  username: string;
  roomId: string;
  roomCode?: string;
  roomName: string;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<"id" | "code" | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, users, typingUsers, status, sendMessage, sendTyping, sendReaction, disconnect } =
    useChatSocket({
      serverUrl: WS_URL,
      roomId,
      roomCode,
      username,
      onError: (msg) => toast({ title: "Error", description: msg, variant: "destructive" }),
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
    inputRef.current?.focus();
  }, [input, sendMessage]);

  const handleLeave = () => {
    disconnect();
    sessionStorage.removeItem(`chat_${roomId}`);
    navigate("/");
  };

  const handleTyping = () => {
    sendTyping();
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 2000);
  };

  const copyToClipboard = (text: string, type: "id" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied!", description: `Room ${type} copied.`, duration: 2000 });
  };

  const inputDisabled = status === "reconnecting";

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: back + room info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleLeave}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">{getRoomIcon(roomName)}</span>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-white truncate">{roomName}</h1>
                <div className="flex items-center gap-1.5">
                  <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
                  <span className="text-xs text-gray-500">{users.length} online</span>
                </div>
              </div>
            </div>

            {status === "reconnecting" && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-950/40 border border-orange-800/50 animate-pulse">
                <WifiOff className="h-3 w-3 text-orange-400" />
                <span className="text-xs text-orange-400">Reconnecting</span>
              </div>
            )}
          </div>

          {/* Right: copy code */}
          <div className="flex items-center gap-2">
            {roomCode && (
              <button
                onClick={() => copyToClipboard(roomCode, "code")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 border border-purple-600/30 hover:bg-purple-600/25 transition-colors"
              >
                {copied === "code" ? (
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-purple-400" />
                )}
                <span className="text-xs font-mono font-medium text-purple-300">{roomCode}</span>
              </button>
            )}

            {!roomCode && (
              <button
                onClick={() => copyToClipboard(roomId, "id")}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                {copied === "id" ? (
                  <CheckCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Online users strip */}
      {users.length > 0 && (
        <div className="bg-[#0a0a0a] border-b border-gray-800/50 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Users className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
            {users.map((u) => (
              <span
                key={u}
                className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                  u === username
                    ? "bg-purple-600 text-white"
                    : "bg-[#1a1a1a] border border-gray-800 text-gray-400"
                }`}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3 pb-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center mb-4">
                <span className="text-3xl">{getRoomIcon(roomName)}</span>
              </div>
              <p className="text-sm font-semibold text-gray-300 mb-1">Start the conversation</p>
              <p className="text-xs text-gray-600 max-w-xs">
                Messages expire in 4 minutes
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isSystem = msg.type === "system";
            const isOwn = msg.username === username;
            const showAvatar = i === 0 || messages[i - 1]?.username !== msg.username;
            const isHovered = msg.id ? hoveredMsgId === msg.id : false;

            return isSystem ? (
              <div key={i} className="flex justify-center animate-fade-in">
                <div className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-gray-800">
                  <p className="text-xs text-gray-500">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div
                key={msg.id || i}
                className={`flex items-end gap-2 animate-slide-in ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                onMouseEnter={() => msg.id && setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
              >
                {/* Avatar */}
                {showAvatar && !isOwn ? (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {msg.username?.charAt(0).toUpperCase()}
                  </div>
                ) : !isOwn ? (
                  <div className="w-7 flex-shrink-0" />
                ) : null}

                <div className={`flex flex-col gap-0.5 max-w-[78%] sm:max-w-sm ${isOwn ? "items-end" : "items-start"}`}>
                  {showAvatar && (
                    <span className={`text-xs font-medium px-1 ${isOwn ? "text-purple-400" : "text-gray-400"}`}>
                      {msg.username}
                    </span>
                  )}

                  <div className="relative">
                    {isHovered && msg.id && (
                      <EmojiPicker
                        isOwn={isOwn}
                        onSelect={(emoji) => {
                          sendReaction(msg.id!, emoji);
                          setHoveredMsgId(null);
                        }}
                      />
                    )}

                    {/* Bubble */}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl transition-all ${
                        isOwn
                          ? "bg-purple-600 text-white rounded-br-md"
                          : "bg-[#1a1a1a] text-gray-100 border border-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Timestamp + read */}
                    <div className={`flex items-center gap-1 px-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isOwn && <CheckCheck className="h-3 w-3 text-purple-500" />}
                    </div>

                    <ExpiryBadge timestamp={msg.timestamp} />

                    {msg.reactions && (
                      <ReactionBar
                        reactions={msg.reactions}
                        currentUsername={username}
                        onReact={(emoji) => msg.id && sendReaction(msg.id, emoji)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <TypingIndicator typingUsers={typingUsers} />
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="bg-[#0a0a0a] border-t border-gray-800 px-4 py-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={inputDisabled ? "Reconnecting..." : "Message..."}
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              maxLength={500}
              disabled={inputDisabled}
              className="h-11 px-4 pr-14 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-600 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 transition-all text-sm"
            />
            <span className="absolute right-3 bottom-3 text-[10px] text-gray-700 font-mono tabular-nums">
              {input.length}/500
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || inputDisabled}
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-purple-500/20"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default ChatRoom;