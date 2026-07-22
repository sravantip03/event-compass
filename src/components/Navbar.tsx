import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Compass, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  };

  const links = (
    <>
      <Link to="/events" className="text-sm font-medium hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>Events</Link>
      {user && <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>Dashboard</Link>}
      {user && <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>Profile</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span>EventCompass<span className="text-gradient"> AI</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">{links}</nav>
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/auth"><Button size="sm" className="bg-gradient-brand text-white hover:opacity-90">Get started</Button></Link>
            </>
          )}
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background px-4 py-4 flex flex-col gap-4">
          {links}
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
          ) : (
            <Link to="/auth"><Button size="sm" className="w-full bg-gradient-brand text-white">Sign in</Button></Link>
          )}
        </div>
      )}
    </header>
  );
}
