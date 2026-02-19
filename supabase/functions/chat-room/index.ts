import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REDIS_URL = Deno.env.get('UPSTASH_REDIS_REST_URL')!;
const REDIS_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!;
const ROOM_TTL = 3600; // 1 hour

async function redis(command: string[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  return res.json();
}

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return map[c] || c;
  }).trim().slice(0, 200);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, roomCode, username } = await req.json();

    if (action === 'create') {
      let code = generateRoomCode();
      // Ensure unique
      let exists = await redis(['EXISTS', `room:${code}`]);
      let attempts = 0;
      while (exists.result === 1 && attempts < 10) {
        code = generateRoomCode();
        exists = await redis(['EXISTS', `room:${code}`]);
        attempts++;
      }

      await redis(['SET', `room:${code}`, JSON.stringify({ users: [], messages: [] }), 'EX', String(ROOM_TTL)]);

      return new Response(JSON.stringify({ roomCode: code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'join') {
      if (!roomCode || !username || !username.trim()) {
        return new Response(JSON.stringify({ error: 'Room code and username required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const safe = sanitize(username);
      const raw = await redis(['GET', `room:${roomCode}`]);
      if (!raw.result) {
        return new Response(JSON.stringify({ error: 'Room not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const room = JSON.parse(raw.result);
      if (!room.users.includes(safe)) {
        room.users.push(safe);
      }
      room.messages.push({ type: 'system', text: `${safe} joined the room`, timestamp: Date.now() });
      await redis(['SET', `room:${roomCode}`, JSON.stringify(room), 'EX', String(ROOM_TTL)]);

      return new Response(JSON.stringify({ success: true, users: room.users, messages: room.messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leave') {
      const safe = sanitize(username);
      const raw = await redis(['GET', `room:${roomCode}`]);
      if (!raw.result) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const room = JSON.parse(raw.result);
      room.users = room.users.filter((u: string) => u !== safe);
      room.messages.push({ type: 'system', text: `${safe} left the room`, timestamp: Date.now() });

      if (room.users.length === 0) {
        await redis(['DEL', `room:${roomCode}`]);
      } else {
        await redis(['SET', `room:${roomCode}`, JSON.stringify(room), 'EX', String(ROOM_TTL)]);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'message') {
      const safe = sanitize(username);
      const { text: rawText } = await req.clone().json();
      const msgText = sanitize(rawText || '');
      
      if (!msgText) {
        return new Response(JSON.stringify({ error: 'Empty message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const raw = await redis(['GET', `room:${roomCode}`]);
      if (!raw.result) {
        return new Response(JSON.stringify({ error: 'Room not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const room = JSON.parse(raw.result);
      const msg = { type: 'message', username: safe, text: msgText, timestamp: Date.now() };
      room.messages.push(msg);
      // Keep last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
      await redis(['SET', `room:${roomCode}`, JSON.stringify(room), 'EX', String(ROOM_TTL)]);

      return new Response(JSON.stringify({ success: true, message: msg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'poll') {
      const raw = await redis(['GET', `room:${roomCode}`]);
      if (!raw.result) {
        return new Response(JSON.stringify({ error: 'Room not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const room = JSON.parse(raw.result);
      return new Response(JSON.stringify({ users: room.users, messages: room.messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
