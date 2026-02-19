

# Real-Time Anonymous Chat Rooms

## Overview
A real-time anonymous chat application where users create/join rooms with 6-digit codes, chat anonymously, and everything is ephemeral — no permanent storage.

## Architecture
- **Frontend**: React with clean, minimal UI
- **Real-time**: Supabase Realtime Broadcast (no database tables needed)
- **Ephemeral storage**: Upstash Redis via Supabase Edge Functions (rooms, users, messages with auto-expiring TTLs)
- **Backend logic**: Supabase Edge Functions for room creation, joining, and message handling

## Pages & Flow

### 1. Landing Page
- Clean centered card with two options: **Create Room** or **Join Room**
- Create Room: generates a 6-digit code, prompts for username, then enters chat
- Join Room: enter room code + username, then enters chat
- Username validation (no empty names)
- Mobile responsive design

### 2. Chat Room Page
- **Header**: Room code (with copy button), user count indicator
- **Message area**: Auto-scrolling chat with username, timestamp, and system notifications (join/leave)
- **Input area**: Message input with send button
- **Typing indicator**: Shows "User is typing..." for other participants
- **Leave button**: Exit the room

## Core Features

### Room Management
- Auto-generated 6-digit room codes
- Rooms stored in Upstash Redis with TTL (auto-expire if inactive)
- Room deleted when last user leaves
- User count displayed in real-time

### Messaging
- Real-time broadcast within room only
- Messages show username + timestamp
- Join/leave system notifications
- Input sanitization to prevent XSS
- Typing indicator broadcast

### Session Behavior
- All data in Redis with expiring keys
- No permanent storage — everything is ephemeral
- Server restart = clean slate (Redis TTLs handle cleanup)

## Edge Functions
- `chat-room`: Handles room creation, joining, leaving, and room state queries via Upstash Redis

## Design
- Clean, minimal UI with soft colors
- Mobile-first responsive layout
- Smooth auto-scroll in chat
- Toast notifications for errors

