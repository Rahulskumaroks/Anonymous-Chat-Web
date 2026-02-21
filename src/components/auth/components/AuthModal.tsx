import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/Authcontext";
import { BASE_URL } from "@/config/config";




interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, signup } = useAuth();

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleTabChange = (val: string) => {
    setTab(val as "login" | "signup");
    reset();
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Redirect to backend Google OAuth — it sets cookies and redirects back
    window.location.href = `${BASE_URL}/auth/google`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to create a room</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>

      

      
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : tab === "login" ? "Login" : "Create Account"}
        </Button> */}

        <div className="flex items-center gap-2 my-1">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={handleGoogleAuth}>
          <GoogleIcon />
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function EmailPasswordForm({ email, setEmail, password, setPassword }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input 
          type="email" 
          placeholder="you@example.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input 
          type="password" 
          placeholder="••••••••" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}