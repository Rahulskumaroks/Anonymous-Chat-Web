import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DURATION_PRESETS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
];

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  setUsername: (value: string) => void;
  roomName: string;
  setRoomName: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  maxPeople: number;
  setMaxPeople: (value: number) => void;
  visibility: "PUBLIC" | "PRIVATE";
  setVisibility: (value: "PUBLIC" | "PRIVATE") => void;
  loading: boolean;
  onSubmit: () => void;
}

export const CreateRoomModal = ({
  open,
  onClose,
  username,
  setUsername,
  roomName,
  setRoomName,
  duration,
  setDuration,
  maxPeople,
  setMaxPeople,
  visibility,
  setVisibility,
  loading,
  onSubmit,
}: CreateRoomModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Room</DialogTitle>
          <p className="text-sm text-gray-400">Set up your ephemeral chat space</p>
        </DialogHeader>

        {/* Tab switcher for Create/Join */}
        <Tabs value="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] border border-gray-800 p-1">
            <TabsTrigger 
              value="create"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
            >
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="join"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
              onClick={onClose}
            >
              Join
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 mt-2">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">YOUR USERNAME</Label>
            <Input
              autoFocus
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              className="bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          {/* Room Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">ROOM NAME</Label>
            <Input
              placeholder="e.g. Study Group 📚"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              maxLength={100}
              className="bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">DURATION</Label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDuration(p.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    duration === p.value
                      ? "border-purple-500 bg-purple-600 text-white"
                      : "border-gray-800 bg-[#1a1a1a] text-gray-400 hover:border-gray-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max People */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-gray-300">MAX PEOPLE</Label>
              <span className="text-lg font-bold text-white">{maxPeople}</span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              value={maxPeople}
              onChange={e => setMaxPeople(Number(e.target.value))}
              className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">VISIBILITY</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  visibility === "PUBLIC"
                    ? "border-purple-500 bg-purple-600/20 text-white"
                    : "border-gray-800 bg-[#1a1a1a] text-gray-400"
                }`}
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Public</span>
              </button>
              
              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  visibility === "PRIVATE"
                    ? "border-purple-500 bg-purple-600/20 text-white"
                    : "border-gray-800 bg-[#1a1a1a] text-gray-400"
                }`}
              >
                <Lock className="h-5 w-5" />
                <span className="text-sm font-medium">Private</span>
              </button>
            </div>
          </div>

          {/* Create Button */}
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold rounded-xl mt-2" 
            onClick={onSubmit} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating…
              </>
            ) : (
              "Create & Join"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};