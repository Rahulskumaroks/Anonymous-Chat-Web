import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsernameModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (username: string) => void;
  roomName: string;
}

export const UsernameModal = ({
  open,
  onClose,
  onSubmit,
  roomName,
}: UsernameModalProps) => {
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    if (username.trim()) {
      onSubmit(username);
      setUsername("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Room</DialogTitle>
          <p className="text-sm text-gray-400">
            Joining: <span className="text-purple-400 font-semibold">{roomName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">YOUR USERNAME</Label>
            <Input
              autoFocus
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              maxLength={20}
              className="bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          {/* Info */}
          <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3 text-xs text-purple-300/70">
            <p className="font-medium text-purple-200 mb-1">🌍 Public Room</p>
            <p>No code needed - just enter your username to join!</p>
          </div>

          {/* Join Button */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold rounded-xl" 
              onClick={handleSubmit} 
              disabled={!username.trim()}
            >
              Join Room
            </Button>
            <Button 
              variant="ghost"
              className="w-full text-gray-400 hover:text-gray-300 hover:bg-gray-800" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};