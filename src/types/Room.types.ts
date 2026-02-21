/**
 * Shared Room types - Import this in all components to ensure consistency
 * Place this file at: src/types/room.ts
 */

export interface Room {
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
  currentPeople?: number;
}

export interface RoomListResponse {
  results: Room[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface CreateRoomRequest {
  name: string;
  duration: number;
  maxPeople: number;
  visibility: "PUBLIC" | "PRIVATE";
}

export interface ChatState {
  username: string;
  room: Room;
}

export interface UseRoomsParams {
  name?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  status?: "ACTIVE" | "ENDED" | "CANCELLED";
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}