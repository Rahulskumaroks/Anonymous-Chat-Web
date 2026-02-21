import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, LogIn, Sparkles } from "lucide-react";

interface HeroProps {
  user: any;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const Hero = ({ user, onCreateRoom, onJoinRoom }: HeroProps) => {
  return (
    <Card className="backdrop-blur-xl bg-slate-900/50 border-purple-500/20 overflow-hidden">
      <CardHeader className="text-center pb-4 relative">
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl" />
        
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 relative">
          <MessageCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
        </div>
        
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
          Meuzz Chat
        </CardTitle>
        
        <CardDescription className="text-purple-200/80 text-base mt-3 max-w-md mx-auto">
          {user ? (
            <>
              <span className="text-purple-300 font-semibold">
                Welcome back{user.name ? `, ${user.name}` : ""}!
              </span>
              <br />
              Create ephemeral chat rooms or join active conversations.
            </>
          ) : (
            <>
              Create or join <span className="text-purple-300 font-semibold">ephemeral chat rooms</span>.
              <br />
              No signup needed to join — just enter and chat.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-6">
        <Button 
          size="lg" 
          className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 h-12 text-base font-semibold"
          onClick={onCreateRoom}
        >
          <Plus className="h-5 w-5" /> Create New Room
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          className="w-full gap-2 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-purple-100 backdrop-blur-sm h-12 text-base font-semibold transition-all duration-300"
          onClick={onJoinRoom}
        >
          <LogIn className="h-5 w-5" /> Join Existing Room
        </Button>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-purple-500/20">
          <FeaturePill icon="⚡" text="Instant" />
          <FeaturePill icon="🔒" text="Private" />
          <FeaturePill icon="⏱️" text="Ephemeral" />
        </div>
      </CardContent>
    </Card>
  );
};

const FeaturePill = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
    <span className="text-xl">{icon}</span>
    <span className="text-xs text-purple-300/80 font-medium">{text}</span>
  </div>
);