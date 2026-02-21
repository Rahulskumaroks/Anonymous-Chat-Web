import {BASE_URL} from '../config/config'

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// POST /room - REQUIRES AUTH
export const createRoom = async ({ name, duration, maxPeople, visibility }) => {
  const res = await fetch(`${BASE_URL}/room`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, duration, maxPeople, visibility }),
  });
  return handleResponse(res);
};

// GET /room - PUBLIC (browse rooms)
// ✅ SIMPLIFIED: Backend filters by PUBLIC and ACTIVE automatically
export const getRooms = async ({ page = 1, limit = 10, sortBy } = {}) => {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (sortBy) params.set("sortBy", sortBy);

  const res = await fetch(`${BASE_URL}/room?${params}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

// ✅ NEW: GET /room/search?q=... - PUBLIC (search rooms by name)
export const searchRooms = async (searchQuery, { page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams();
  params.set("q", searchQuery);
  params.set("page", page);
  params.set("limit", limit);

  const res = await fetch(`${BASE_URL}/room/search?${params}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

// GET /room/join/:code - PUBLIC (join by code)
export const getRoomByCode = async (code) => {
  const res = await fetch(`${BASE_URL}/room/join/${code}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

// GET /room/:roomId - PUBLIC (get room details by ID)
export const getRoomById = async (roomId) => {
  const res = await fetch(`${BASE_URL}/room/${roomId}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

// PATCH /room/:roomId - REQUIRES AUTH
export const updateRoom = async (roomId, body) => {
  const res = await fetch(`${BASE_URL}/room/${roomId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

// DELETE /room/:roomId - REQUIRES AUTH
export const deleteRoom = async (roomId) => {
  const res = await fetch(`${BASE_URL}/room/${roomId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete room");
  }
  return true;
};