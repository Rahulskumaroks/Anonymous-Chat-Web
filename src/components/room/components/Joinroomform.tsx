import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  setCode: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export const JoinRoomModal = ({
  open,
  onClose,
  code,
  setCode,
  username,
  setUsername,
  loading,
  onSubmit,
}: JoinRoomModalProps) => {
  const handleOpenCreateModal = () => {
    onClose();
    // This would trigger the create modal - you'll need to pass a handler from parent
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Room</DialogTitle>
          <p className="text-sm text-gray-400">Enter the room code to join</p>
        </DialogHeader>

        {/* Tab switcher for Create/Join */}
        <Tabs value="join" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] border border-gray-800 p-1">
            <TabsTrigger 
              value="create"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
              onClick={handleOpenCreateModal}
            >
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="join"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
            >
              Join
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 mt-2">
          {/* Room Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">ROOM CODE</Label>
            <Input
              autoFocus
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="font-mono text-2xl text-center tracking-[0.5em] bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-14"
              maxLength={6}
            />
            <p className="text-xs text-gray-500">
              Ask the room creator for their 6-digit code
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">YOUR USERNAME</Label>
            <Input
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === "Enter" && code.length === 6 && onSubmit()}
              className="bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          {/* Join Button */}
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold rounded-xl mt-4" 
            onClick={onSubmit} 
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining…
              </>
            ) : (
              "Join Room"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};