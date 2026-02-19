import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { WS_URL } from "@/lib/chatApi";
import { Copy, LogOut, Send, Users, WifiOff, Clock } from "lucide-react";
import { useChatSocket } from "@/hooks/useChatSocket";

const MESSAGE_TTL_MS = 4 * 60 * 1000; // must match server

function ExpiryBadge({ timestamp }: { timestamp: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const left = Math.max(0, MESSAGE_TTL_MS - (Date.now() - timestamp));
      setRemaining(left);
    };
    calc();
    const t = setInterval(calc, 10_000);
    return () => clearInterval(t);
  }, [timestamp]);

  if (remaining > 60_000) return null; // only show in last 60 seconds

  const secs = Math.ceil(remaining / 1000);
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-orange-400 mt-0.5">
      <Clock className="h-2.5 w-2.5" />
      {secs}s
    </span>
  );
}

const ChatRoom = () => {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const username = (location.state as any)?.username as string;

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Redirect if no username/code
  useEffect(() => {
    if (!username || !code) navigate("/");
  }, [username, code, navigate]);

  const { messages, users, typingUsers, status, sendMessage, sendTyping, disconnect } =
    useChatSocket({
      serverUrl: WS_URL,
      roomCode: code || "",
      username: username || "",
      onError: (msg) => toast({ title: "Error", description: msg, variant: "destructive" }),
    });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }, [input, sendMessage]);

  const handleLeave = () => {
    disconnect();
    navigate("/");
  };

  const handleTyping = () => {
    sendTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code || "");
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };

  if (!username || !code) return null;

  // Only disable input when truly reconnecting (not on initial "connecting")
  const inputDisabled = status === "reconnecting";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5 font-mono" onClick={copyCode}>
            {code} <Copy className="h-3 w-3" />
          </Button>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {users.length}
          </span>
          {/* Only show this badge when actually reconnecting — invisible on first load */}
          {status === "reconnecting" && (
            <span className="flex items-center gap-1 text-xs text-orange-400 animate-pulse">
              <WifiOff className="h-3 w-3" />
              Reconnecting...
            </span>
          )}

        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Leave
        </Button>
      </header>

      {/* Online users bar */}
      {users.length > 0 && (
        <div className="border-b px-4 py-1.5 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Online:{" "}
            {users.map((u, i) => (
              <span key={u}>
                <span className={u === username ? "font-semibold text-foreground" : ""}>{u}</span>
                {i < users.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.map((msg, i) =>
            msg.type === "system" ? (
              <div key={i} className="text-center text-xs text-muted-foreground py-1">
                {msg.text}
              </div>
            ) : (
              <div
                key={msg.id || i}
                className={`flex flex-col ${msg.username === username ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-muted-foreground mb-0.5">{msg.username}</span>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[75%] break-words ${
                    msg.username === username
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <ExpiryBadge timestamp={msg.timestamp} />
                </div>
              </div>
            )
          )}

          {typingUsers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
              <span className="flex gap-0.5">
                <span className="animate-bounce [animation-delay:0ms]">•</span>
                <span className="animate-bounce [animation-delay:150ms]">•</span>
                <span className="animate-bounce [animation-delay:300ms]">•</span>
              </span>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            placeholder={inputDisabled ? "Reconnecting..." : "Type a message..."}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={500}
            disabled={inputDisabled}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || inputDisabled}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;