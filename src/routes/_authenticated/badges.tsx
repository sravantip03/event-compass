import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAllBadges } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({
    meta: [
      { title: "My badges — EventCompass AI" },
      { name: "description", content: "Unlock badges as you attend events and level up your builder journey." },
    ],
  }),
  component: BadgesPage,
});

function BadgesPage() {
  const fn = useServerFn(getAllBadges);
  const q = useQuery({ queryKey: ["badges", "all"], queryFn: () => fn() });
  if (q.isLoading) return <div className="p-10 text-center">Loading…</div>;
  const badges = q.data ?? [];
  const unlocked = badges.filter((b: any) => b.unlocked);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
        <Award className="h-8 w-8 text-primary" />My badges
      </h1>
      <p className="text-muted-foreground mt-1">{unlocked.length} of {badges.length} unlocked · {unlocked.reduce((s: number, b: any) => s + (b.xp_reward ?? 0), 0)} XP from badges</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
        {badges.map((b: any) => (
          <Card key={b.id} className={`p-5 text-center relative overflow-hidden ${b.unlocked ? "" : "opacity-70"}`}>
            {b.unlocked && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />}
            <div className={`mx-auto h-20 w-20 rounded-2xl grid place-items-center text-4xl ${b.unlocked ? "bg-gradient-brand shadow-glow" : "bg-muted"}`}>
              {b.unlocked ? (b.icon ?? "🏆") : <Lock className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="font-semibold mt-3">{b.name}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.4em]">{b.description}</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant={b.unlocked ? "default" : "outline"}>+{b.xp_reward ?? 0} XP</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              {b.unlocked && b.unlocked_at ? `Earned ${format(new Date(b.unlocked_at), "PP")}` : "Locked"}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
