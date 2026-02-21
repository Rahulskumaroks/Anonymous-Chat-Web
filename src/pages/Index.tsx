import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { createRoom, getRoomByCode } from "@/lib/roomApi";
import { Loader2, Home as HomeIcon, Plus, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/Authcontext";
import { RoomListSection } from "@/components/room/components/Roomlistsection";
import { CreateRoomModal } from "@/components/room/components/Createroomform";
import { JoinRoomModal } from "@/components/room/components/Joinroomform";
import { UsernameModal } from "@/components/room/components/UsernameModal";
import { AuthModal } from "@/components/auth/components/AuthModal";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [joinUsername, setJoinUsername] = useState("");
  
  // Create form state
  const [createUsername, setCreateUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxPeople, setMaxPeople] = useState(10);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // ✅ Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    
    // Only start pull if at top of page
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      setIsPulling(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    
    // Only pull down (positive distance)
    if (distance > 0) {
      // Max pull distance of 100px with resistance
      const maxPull = 100;
      const resistance = 0.5;
      const adjustedDistance = Math.min(distance * resistance, maxPull);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    // Trigger refresh if pulled more than 60px
    if (pullDistance > 60) {
      handleRefresh();
    }
    
    setPullDistance(0);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    
    // Reset after 800ms (time for API call + animation)
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const handleCreateRoomClick = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to create a room.", 
        variant: "destructive" 
      });
      return;
    }

    if (!createUsername.trim()) {
      toast({ 
        title: "Username required", 
        description: "Please enter a username.", 
        variant: "destructive" 
      });
      return;
    }

    if (roomName.trim().length < 2) {
      toast({ 
        title: "Room name too short", 
        description: "Must be at least 2 characters.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const room = await createRoom({
        name: roomName.trim(),
        duration: Number(duration),
        maxPeople: Number(maxPeople),
        visibility,
      });
      
      if (visibility === "PRIVATE" && room.code) {
        toast({
          title: "Room created! 🎉",
          description: `Share this code: ${room.code}`,
          duration: 10000,
        });
      }
      
      const chatState = {
        username: createUsername.trim(),
        room
      };
      sessionStorage.setItem(`chat_${room.id}`, JSON.stringify(chatState));
      
      navigate(`/chat/${room.id}`, { 
        state: chatState
      });
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e.message || "Failed to create room", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinUsername.trim()) {
      toast({ 
        title: "Username required", 
        description: "Please enter a username.", 
        variant: "destructive" 
      });
      return;
    }

    if (!joinCode.trim()) {
      toast({ 
        title: "Room code required", 
        description: "Please enter the 6-digit room code.", 
        variant: "destructive" 
      });
      return;
    }

    if (joinCode.length !== 6) {
      toast({ 
        title: "Invalid code", 
        description: "Room code must be exactly 6 digits.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const room = await getRoomByCode(joinCode.trim());
      
      if (room.status !== "ACTIVE") {
        toast({ 
          title: "Room unavailable", 
          description: "This room has ended or been cancelled.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      if (room.currentUsers >= room.maxPeople) {
        toast({ 
          title: "Room is full", 
          description: `This room has reached its maximum capacity of ${room.maxPeople} people.`, 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const chatState = {
        username: joinUsername.trim(),
        room: {
          ...room,
          code: joinCode.trim(),
        },
      };

      sessionStorage.setItem(`chat_${room.id}`, JSON.stringify(chatState));

      navigate(`/chat/${room.id}`, {
        state: chatState,
      });
    } catch (e: any) {
      console.error('Join error:', e);
      toast({ 
        title: "Room not found", 
        description: "Invalid room code or room has ended.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickJoin = (room: any) => {
    if (room.currentUsers >= room.maxPeople) {
      toast({ 
        title: "Room is full", 
        description: `This room has reached its maximum capacity.`, 
        variant: "destructive" 
      });
      return;
    }

    if (room.visibility === "PUBLIC") {
      setSelectedRoom(room);
      setShowUsernameModal(true);
    } else {
      setShowJoinModal(true);
    }
  };

  const handleJoinPublicRoom = (username: string) => {
    if (!selectedRoom) return;

    if (selectedRoom.currentUsers >= selectedRoom.maxPeople) {
      toast({ 
        title: "Room is full", 
        description: "This room filled up while you were entering your username.", 
        variant: "destructive" 
      });
      setShowUsernameModal(false);
      setSelectedRoom(null);
      return;
    }

    const chatState = {
      username: username.trim(),
      room: selectedRoom,
    };

    sessionStorage.setItem(`chat_${selectedRoom.id}`, JSON.stringify(chatState));

    navigate(`/chat/${selectedRoom.id}`, {
      state: chatState,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 overflow-hidden">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Rooms</h1>
          
          {/* Manual refresh button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Refresh rooms"
            disabled={isRefreshing}
          >
            <RefreshCw 
              className={`h-5 w-5 text-gray-400 hover:text-white transition-transform ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      <div 
        className="relative z-20 flex items-center justify-center transition-all duration-300"
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <RefreshCw 
            className={`h-6 w-6 text-purple-500 transition-transform ${
              pullDistance > 60 ? 'animate-spin' : ''
            }`}
            style={{ 
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
          <p className="text-xs text-gray-400">
            {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </p>
        </div>
      </div>

      {/* Scrollable content with pull-to-refresh */}
      <div 
        ref={scrollContainerRef}
        className="overflow-y-auto"
        style={{ 
          height: 'calc(100vh - 68px - 72px)', // Full height minus header and bottom nav
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-4">
          <RoomListSection 
            key={refreshKey}
            currentUserId={user?.id}
            onJoinRoom={handleQuickJoin}
          />
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800 px-4 py-3 flex items-center justify-around z-10">
        <button className="flex flex-col items-center gap-1 text-purple-500">
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </button>
        
        <button 
          onClick={handleCreateRoomClick}
          className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-500/50"
        >
          <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
        </button>
        
      <button onClick={() => navigate("/profile")} className="...">
  <User className="h-7 w-7 text-white" strokeWidth={2.5} />
  <span className="text-xs font-medium">Profile</span>
</button>
      </div>

      {/* Modals */}
      <CreateRoomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        username={createUsername}
        setUsername={setCreateUsername}
        roomName={roomName}
        setRoomName={setRoomName}
        duration={duration}
        setDuration={setDuration}
        maxPeople={maxPeople}
        setMaxPeople={setMaxPeople}
        visibility={visibility}
        setVisibility={setVisibility}
        loading={loading}
        onSubmit={handleCreate}
      />

      <JoinRoomModal
        open={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setJoinCode("");
          setJoinUsername("");
        }}
        code={joinCode}
        setCode={setJoinCode}
        username={joinUsername}
        setUsername={setJoinUsername}
        loading={loading}
        onSubmit={handleJoinWithCode}
      />

      <UsernameModal
        open={showUsernameModal}
        onClose={() => {
          setShowUsernameModal(false);
          setSelectedRoom(null);
        }}
        onSubmit={handleJoinPublicRoom}
        roomName={selectedRoom?.name || ""}
      />

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;