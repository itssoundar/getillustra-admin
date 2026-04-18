import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;

      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setError(error.message);
            return;
          }

          if (type === "invite" || type === "recovery") {
            setLocation("/settings");
          } else {
            setLocation("/dashboard");
          }
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError("Invalid or expired link. Please request a new invite.");
        return;
      }

      setLocation("/dashboard");
    };

    handleCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <a
          href="/signin"
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
