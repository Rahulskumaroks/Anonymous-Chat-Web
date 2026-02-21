import { Button } from "@/components/ui/button";
import { Users, Clock, Globe, Lock } from "lucide-react";

// Updated interface with backend fields
interface Room {
  id: string;
  name: string;
  duration: number;
  maxPeople: number;
  visibility: "PUBLIC" | "PRIVATE";
  status: "ACTIVE" | "ENDED" | "CANCELLED";
  createdBy: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  code?: string;
  // ✅ NEW: Backend now returns these fields
  currentUsers: number;  // Real-time count from WebSocket
  users: string[];       // Array of usernames currently in room
}

interface RoomCardProps {
  room: Room;
  currentUserId?: string;
  onJoin: (room: Room) => void;
  onDelete: () => void;
}

export const RoomCard = ({ room, currentUserId, onJoin }: RoomCardProps) => {
  const getTimeRemaining = () => {
    if (!room.endsAt) return "N/A";
    
    const end = new Date(room.endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chill') || lower.includes('vibes')) return '🎵';
    if (lower.includes('study') || lower.includes('group')) return '📚';
    if (lower.includes('chat') || lower.includes('random')) return '💬';
    if (lower.includes('game') || lower.includes('gaming')) return '🎮';
    if (lower.includes('rock') || lower.includes('music')) return '🎸';
    return '💬';
  };

  // ✅ Use backend's real-time data
  const currentUsers = room.currentUsers || 0;
  const isFull = currentUsers >= room.maxPeople;
  const userList = room.users || [];

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Room name with icon */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getIcon(room.name)}</span>
            <h3 className="font-semibold text-white text-base truncate">
              {room.name}
            </h3>
          </div>
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Users className={`h-3.5 w-3.5 ${isFull ? 'text-orange-400' : ''}`} />
              <span className={isFull ? 'text-orange-400 font-medium' : ''}>
                {currentUsers} / {room.maxPeople}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{getTimeRemaining()}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {room.visibility === "PUBLIC" ? (
                <Globe className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>{room.visibility === "PUBLIC" ? "Public" : "Private"}</span>
            </div>
          </div>

          {/* ✅ NEW: Show active users (if any) */}
          {userList.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {userList.slice(0, 3).map((username, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border border-[#1a1a1a] flex items-center justify-center text-[10px] font-medium text-white"
                    title={username}
                  >
                    {username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {userList.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-700 border border-[#1a1a1a] flex items-center justify-center text-[10px] font-medium text-gray-300">
                    +{userList.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500">
                {userList.slice(0, 2).join(', ')}
                {userList.length > 2 && ` +${userList.length - 2} more`}
              </span>
            </div>
          )}
        </div>

        {/* Join button */}
        <Button
          onClick={() => onJoin(room)}
          disabled={isFull}
          className={`ml-3 px-6 h-9 rounded-lg font-medium ${
            isFull 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed hover:bg-gray-700'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isFull ? 'Full' : 'Join'}
        </Button>
      </div>
    </div>
  );
};