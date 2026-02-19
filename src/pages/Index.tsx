import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { createRoom, checkRoom } from "@/lib/chatApi";
import { MessageCircle, Plus, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please enter a username.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await createRoom();
      navigate(`/chat/${data.roomCode}`, { state: { username: username.trim() } });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please enter a username.", variant: "destructive" });
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      toast({ title: "Invalid code", description: "Enter a valid 6-digit room code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Verify room exists before navigating
      await checkRoom(roomCode.trim());
      navigate(`/chat/${roomCode.trim()}`, { state: { username: username.trim() } });
    } catch (e: any) {
      toast({ title: "Room not found", description: "Check the room code and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Anonymous Chat</CardTitle>
          <CardDescription>Create or join an ephemeral chat room. No signup needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "home" && (
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full gap-2" onClick={() => setMode("create")}>
                <Plus className="h-4 w-4" /> Create Room
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" onClick={() => setMode("join")}>
                <LogIn className="h-4 w-4" /> Join Room
              </Button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-3">
              <Input
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button className="w-full" onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create & Join"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode("home")}>
                Back
              </Button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-3">
              <Input
                placeholder="6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
              <Input
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button className="w-full" onClick={handleJoin} disabled={loading}>
                {loading ? "Joining..." : "Join Room"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode("home")}>
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;