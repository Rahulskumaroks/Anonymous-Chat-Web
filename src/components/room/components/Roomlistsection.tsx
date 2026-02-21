import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRooms } from "@/hooks/useRoom";
import { searchRooms } from "@/lib/roomApi";
import { RoomCard } from "./RoomCard";
import { Search, Loader2 } from "lucide-react";

interface RoomListSectionProps {
  currentUserId?: string;
  onJoinRoom: (room: any) => void;
}

export const RoomListSection = ({ currentUserId, onJoinRoom }: RoomListSectionProps) => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Default room list (when no search)
  const { rooms, loading, error, refetch } = useRooms({
    visibility: "PUBLIC",
    status: "ACTIVE",
  });

  // Debounced search effect
  useEffect(() => {
    const trimmedSearch = search.trim();
    
    // If search is empty or too short, show default list
    if (trimmedSearch.length < 2) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    // Debounce search
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      
      try {
        const response = await searchRooms(trimmedSearch, { page: 1, limit: 20 });
        setSearchResults(response.results || []);
      } catch (err: any) {
        console.error('Search error:', err);
        setSearchError(err.message || "Failed to search rooms");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = () => {
    refetch({ 
      status: "ACTIVE", 
    });
  };

  // Determine which rooms to display
  const isSearching = search.trim().length >= 2;
  const displayRooms = isSearching ? searchResults : rooms;
  const displayLoading = isSearching ? searchLoading : loading;
  const displayError = isSearching ? searchError : error;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rooms..."
          className="pl-10 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
        />
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-500" />
        )}
      </div>

      {/* Search hint */}
      {search.trim().length > 0 && search.trim().length < 2 && (
        <p className="text-xs text-gray-500 px-1">
          Type at least 2 characters to search
        </p>
      )}

      {/* Error */}
      {displayError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {displayError}
        </div>
      )}

      {/* Rooms list */}
      <div className="space-y-3">
        {displayLoading ? (
          <SkeletonGrid />
        ) : displayRooms.length === 0 ? (
          <EmptyRooms isSearching={isSearching} searchTerm={search.trim()} />
        ) : (
          <>
            {isSearching && (
              <p className="text-xs text-gray-500 px-1">
                Found {displayRooms.length} room{displayRooms.length !== 1 ? 's' : ''}
              </p>
            )}
            {displayRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                currentUserId={currentUserId}
                onJoin={onJoinRoom}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className="h-24 rounded-lg bg-[#1a1a1a] border border-gray-800 animate-pulse"
      />
    ))}
  </div>
);

interface EmptyRoomsProps {
  isSearching: boolean;
  searchTerm: string;
}

const EmptyRooms = ({ isSearching, searchTerm }: EmptyRoomsProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center mb-3">
      <span className="text-3xl">{isSearching ? "🔍" : "💬"}</span>
    </div>
    <p className="text-sm font-semibold text-gray-300 mb-1">
      {isSearching ? `No rooms found for "${searchTerm}"` : "No rooms found"}
    </p>
    <p className="text-xs text-gray-500">
      {isSearching ? "Try a different search term" : "Create one to get started"}
    </p>
  </div>
);