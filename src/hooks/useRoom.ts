import { useState, useEffect, useCallback } from "react";
import { getRooms, deleteRoom } from "@/lib/roomApi";

interface UseRoomsParams {
  name?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  status?: "ACTIVE" | "ENDED" | "CANCELLED";
  sortBy?: string;
  page?: number;
  limit?: number;
}

// Updated Room interface to match your actual API response
interface Room {
  id: string;
  name: string;
  duration: number;
  maxPeople: number;
  visibility: "PUBLIC" | "PRIVATE";
  status: "ACTIVE" | "ENDED" | "CANCELLED";
  createdBy: string;  // ← Changed from creatorId
  endsAt: string;     // ← Changed from endTime
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  code?: string;
  currentPeople?: number; // Optional since API doesn't always return this
}

interface Pagination {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

export const useRooms = (initialParams: UseRoomsParams = {}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalResults: 0,
    totalPages: 0,
  });
  const [params, setParams] = useState<UseRoomsParams>(initialParams);

  const fetchRooms = useCallback(async (fetchParams: UseRoomsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getRooms(fetchParams);
      
      // Handle the response structure from your API
      if (response.results) {
        // Your API response has { results: [], page, limit, totalPages, totalResults }
        setRooms(response.results);
        setPagination({
          page: response.page,
          limit: response.limit,
          totalResults: response.totalResults,
          totalPages: response.totalPages,
        });
      } else if (response.rooms && response.pagination) {
        // Alternative: Response has both rooms and pagination
        setRooms(response.rooms);
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        // Response is just an array of rooms
        setRooms(response);
        setPagination({
          page: 1,
          limit: response.length,
          totalResults: response.length,
          totalPages: 1,
        });
      } else if (response.data) {
        // Response has data property
        setRooms(response.data);
        setPagination(response.pagination || {
          page: 1,
          limit: response.data.length,
          totalResults: response.data.length,
          totalPages: 1,
        });
      }
    } catch (err: any) {
      console.error("Error fetching rooms:", err);
      setError(err.message || "Failed to fetch rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRooms(params);
  }, [params, fetchRooms]);

  // Refetch with new parameters
  const refetch = useCallback((newParams: UseRoomsParams = {}) => {
    setParams({ ...params, ...newParams });
  }, [params]);

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setParams({ ...params, page: pagination.page + 1 });
    }
  }, [params, pagination.page, pagination.totalPages]);

  // Navigate to previous page
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setParams({ ...params, page: pagination.page - 1 });
    }
  }, [params, pagination.page]);

  // Delete a room and refetch
  const handleDelete = useCallback(async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      // Refetch current page
      fetchRooms(params);
      return true;
    } catch (err: any) {
      console.error("Error deleting room:", err);
      setError(err.message || "Failed to delete room");
      return false;
    }
  }, [params, fetchRooms]);

  return {
    rooms,
    loading,
    error,
    pagination,
    refetch,
    nextPage,
    prevPage,
    deleteRoom: handleDelete,
  };
};