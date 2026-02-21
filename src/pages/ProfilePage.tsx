import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Authcontext";
import {
  ArrowLeft,
  Home as HomeIcon,
  Plus,
  User,
  Clock,
  Users,
  Lock,
  Globe,
  LogOut,
  CheckCircle,
  XCircle,
  Calendar,
  Hash,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { BASE_URL } from "@/config/config";
import { AuthModal } from "@/components/auth/components/AuthModal";




const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed with status ${res.status}`);
  return data;
};

const getUserProfile = async () => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isRoomLive = (endsAt: string) => new Date(endsAt) > new Date();

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) => {
  const colors = [
    ["#6d28d9", "#8b5cf6"],
    ["#0e7490", "#22d3ee"],
    ["#b45309", "#f59e0b"],
    ["#be123c", "#f43f5e"],
    ["#15803d", "#4ade80"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [from, to] = colors[idx];
  const dim = size === "lg" ? 80 : 36;

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size === "lg" ? 28 : 13,
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "-0.5px",
        flexShrink: 0,
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {getInitials(name || "?")}
    </div>
  );
};

// ─── Room Card ───────────────────────────────────────────────────────────────

const RoomCard = ({ room, onClick }: { room: any; onClick: () => void }) => {
  const live = isRoomLive(room.endsAt);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: live ? "rgba(74, 222, 128, 0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${live ? "rgba(74, 222, 128, 0.3)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {room.visibility === "PRIVATE" ? (
          <Lock size={16} color={live ? "#4ade80" : "#6b7280"} />
        ) : (
          <Globe size={16} color={live ? "#4ade80" : "#6b7280"} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f9fafb",
              fontFamily: "'Syne', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {room.name}
          </span>
          {live && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#4ade80",
                background: "rgba(74, 222, 128, 0.15)",
                border: "1px solid rgba(74, 222, 128, 0.3)",
                borderRadius: 4,
                padding: "1px 6px",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              LIVE
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={11} />
            {room.maxPeople} max
          </span>
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} />
            {formatDuration(room.duration)}
          </span>
          <span style={{ fontSize: 12, color: "#4b5563" }}>{timeAgo(room.createdAt)}</span>
        </div>
      </div>

      <ChevronRight size={16} color="#374151" />
    </button>
  );
};

// ─── Stat Chip ───────────────────────────────────────────────────────────────

const StatChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div
    style={{
      flex: 1,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "14px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
    }}
  >
    <div style={{ color: "#6b7280" }}>{icon}</div>
    <span style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
      {value}
    </span>
    <span style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>{label}</span>
  </div>
);

// ─── Verified Badge ───────────────────────────────────────────────────────────

const VerifiedBadge = ({ verified, label }: { verified: boolean; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: verified ? "#4ade80" : "#6b7280" }}>
    {verified ? <CheckCircle size={13} /> : <XCircle size={13} />}
    {label}
  </div>
);

// ─── Guest / Not Signed Up UI ─────────────────────────────────────────────────

const GuestProfileView = ({ onSignIn }: { onSignIn: () => void }) => (
  <div style={{ padding: "0 16px" }}>
    {/* Ghost Hero Card */}
    <div
      className="fade-up fade-up-1"
      style={{
        marginTop: 20,
        background: "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(20,20,20,0.6))",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: 20,
        padding: "32px 20px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Ghost avatar ring */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "2px dashed rgba(139,92,246,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          position: "relative",
        }}
      >
        <User size={36} color="rgba(139,92,246,0.5)" strokeWidth={1.5} />
        {/* Sparkle badge */}
        <div
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #080808",
          }}
        >
          <Sparkles size={12} color="#fff" />
        </div>
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#f9fafb",
          fontFamily: "'Syne', sans-serif",
          marginBottom: 8,
        }}
      >
        You're not signed in
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 24, maxWidth: 280, margin: "0 auto 24px" }}>
        Create an account to build rooms, track your sessions, and connect with others.
      </p>

      {/* CTA Button */}
      <button
        onClick={onSignIn}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          border: "none",
          borderRadius: 14,
          padding: "13px 28px",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'Syne', sans-serif",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(109,40,217,0.4)",
          transition: "transform 0.15s, box-shadow 0.15s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,40,217,0.55)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(109,40,217,0.4)";
        }}
      >
        Sign up / Log in
        <ArrowRight size={15} />
      </button>
    </div>

    {/* Ghost Stats Row */}
    <div className="fade-up fade-up-2" style={{ display: "flex", gap: 10, marginTop: 14 }}>
      {[
        { icon: <Hash size={16} />, label: "Rooms Created", value: "—" },
        { icon: <Globe size={16} />, label: "Live Now", value: "—" },
        { icon: <Users size={16} />, label: "Total Capacity", value: "—" },
      ].map((chip) => (
        <StatChip key={chip.label} icon={chip.icon} label={chip.label} value={chip.value} />
      ))}
    </div>

    {/* Feature Highlights */}
    <div className="fade-up fade-up-3" style={{ marginTop: 24 }}>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#4b5563",
          fontFamily: "'Syne', sans-serif",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        What you'll unlock
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { emoji: "🏠", title: "Create rooms", desc: "Host public or private sessions with custom durations" },
          { emoji: "⚡", title: "Live tracking", desc: "See your active rooms and who's joining in real time" },
          { emoji: "📊", title: "Your stats", desc: "Track rooms created, capacity used, and session history" },
        ].map((feat) => (
          <div
            key={feat.title}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{feat.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>
                {feat.title}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{feat.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Profile Page ─────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "ended">("all");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      // Guest — no need to fetch
      setLoading(false);
      return;
    }

    getUserProfile()
      .then((data) => setProfile(data.data?.user || data.user || data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading, authUser]);

  const rooms: any[] = profile?.rooms || [];
  const liveRooms = rooms.filter((r) => isRoomLive(r.endsAt) && r.status === "ACTIVE");
  const endedRooms = rooms.filter((r) => !isRoomLive(r.endsAt) || r.status !== "ACTIVE");
  const tabRooms = activeTab === "live" ? liveRooms : activeTab === "ended" ? endedRooms : rooms;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24 }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const isGuest = !authUser || !profile;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .tab-btn {
          flex: 1; padding: 8px 12px; border-radius: 10px;
          border: 1px solid transparent; background: transparent;
          color: #6b7280; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .tab-btn.active {
          background: rgba(139,92,246,0.15);
          border-color: rgba(139,92,246,0.35);
          color: #c4b5fd;
        }
        ::-webkit-scrollbar { width: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.1s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.2s; }

        @keyframes pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.04); }
        }
        .ghost-avatar { animation: pulse-ring 2.8s ease-in-out infinite; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", paddingBottom: 88, overflowX: "hidden" }}>

        {/* ── Header ── */}
        <div
          style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "rgba(8,8,8,0.92)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13 }}
          >
            <ArrowLeft size={15} />
          </button>

          <span style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb", fontFamily: "'Syne', sans-serif" }}>
            Profile
          </span>

          {isGuest ? (
            // Guest header action: Sign in button
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#a78bfa", fontSize: 13, fontWeight: 500 }}
            >
              Sign in
            </button>
          ) : (
            <button
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#f87171", fontSize: 13 }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* ── Main Content ── */}
        {isGuest ? (
          <GuestProfileView onSignIn={() => setAuthModalOpen(true)} />
        ) : (
          <div style={{ padding: "0 16px" }}>

            {/* ── Hero Card ── */}
            <div
              className="fade-up fade-up-1"
              style={{
                marginTop: 20,
                background: "linear-gradient(135deg, rgba(109,40,217,0.12), rgba(30,30,30,0.4))",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: 20,
                padding: "24px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <Avatar name={profile?.name || profile?.email || "U"} size="lg" />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9fafb", fontFamily: "'Syne', sans-serif", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {profile?.name || "Anonymous"}
                  </h2>
                  {profile?.email && <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{profile.email}</p>}
                  {profile?.phoneNumber && <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{profile.phoneNumber}</p>}
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {profile?.email && <VerifiedBadge verified={profile.isEmailVerified} label="Email" />}
                    {profile?.phoneNumber && <VerifiedBadge verified={profile.isPhoneVerified} label="Phone" />}
                  </div>
                </div>
              </div>

              {joinDate && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5563" }}>
                  <Calendar size={12} />
                  Member since {joinDate}
                </div>
              )}
            </div>

            {/* ── Stats Row ── */}
            <div className="fade-up fade-up-2" style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <StatChip icon={<Hash size={16} />} label="Rooms Created" value={rooms.length} />
              <StatChip icon={<Globe size={16} />} label="Live Now" value={liveRooms.length} />
              <StatChip icon={<Users size={16} />} label="Total Capacity" value={rooms.reduce((a, r) => a + (r.maxPeople || 0), 0)} />
            </div>

            {/* ── Rooms Section ── */}
            <div className="fade-up fade-up-3" style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb", fontFamily: "'Syne', sans-serif" }}>
                  My Rooms
                </h3>
              </div>

              {rooms.length > 0 && (
                <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
                  {(["all", "live", "ended"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "all" ? `All (${rooms.length})` : tab === "live" ? `Live (${liveRooms.length})` : `Ended (${endedRooms.length})`}
                    </button>
                  ))}
                </div>
              )}

              <div className="fade-up fade-up-4" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tabRooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>
                      {activeTab === "live" ? "⚡" : activeTab === "ended" ? "📦" : "🏠"}
                    </div>
                    <p style={{ color: "#6b7280", fontSize: 14 }}>
                      {activeTab === "live" ? "No live rooms right now" : activeTab === "ended" ? "No ended rooms yet" : "You haven't created any rooms yet"}
                    </p>
                    {activeTab === "all" && (
                      <button
                        onClick={() => navigate("/")}
                        style={{ marginTop: 16, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Create your first room
                      </button>
                    )}
                  </div>
                ) : (
                  tabRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onClick={() => navigate(`/chat/${room.id}`)} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Nav ── */}
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 10,
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px 12px" }}
          >
            <HomeIcon size={22} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>Home</span>
          </button>

          <button
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, marginTop: -28, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 24px rgba(109,40,217,0.5)", border: "none", cursor: "pointer" }}
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </button>

          <button
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: "#a78bfa", padding: "4px 12px" }}
          >
            <User size={22} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Profile</span>
          </button>
        </div>
      </div>

      {/* ── Auth Modal ── */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          // Reload profile after sign in
          setLoading(true);
          getUserProfile()
            .then((data) => setProfile(data.data?.user || data.user || data))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        }}
      />
    </>
  );
};

export default ProfilePage;