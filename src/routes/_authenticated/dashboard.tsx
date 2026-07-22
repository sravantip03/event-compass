import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyDashboard } from "@/lib/events.functions";
import { getRecommendations } from "@/lib/recommendations.functions";
import { EventCard } from "@/components/EventCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { Sparkles, Trophy, Award, Bookmark, Zap, Rocket, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EventCompass AI" }, { name: "description", content: "Your personalized events, saved list, applications, and badges." }] }),
  component: Dashboard,
});

function Dashboard() {
  const dashFn = useServerFn(getMyDashboard);
  const recFn = useServerFn(getRecommendations);
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const recQ = useQuery({ queryKey: ["recommendations"], queryFn: () => recFn() });

  const dash = dashQ.data;
  const level = Math.floor((dash?.profile?.xp_points ?? 0) / 100) + 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-hero text-white p-8 md:p-10 shadow-glow mb-8">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <div className="text-white/80 text-sm">Welcome back{dash?.profile?.full_name ? `, ${dash.profile.full_name.split(" ")[0]}` : ""} 👋</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Your event compass</h1>
          </div>
          <div className="flex gap-6 items-center">
            <StatBadge label="XP" value={dash?.profile?.xp_points ?? 0} icon={Zap} />
            <StatBadge label="Level" value={level} icon={Star} />
            <StatBadge label="Badges" value={dash?.badges?.length ?? 0} icon={Award} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <MiniStat label="Applied" value={dash?.applied?.length ?? 0} icon={Rocket} />
        <MiniStat label="Saved" value={dash?.saved?.length ?? 0} icon={Bookmark} />
        <MiniStat label="Certificates" value={dash?.certificates?.length ?? 0} icon={Trophy} />
        <MiniStat label="Recommended" value={recQ.data?.length ?? 0} icon={Sparkles} />
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">AI recommendations</h2>
          <Badge variant="outline" className="ml-2">Powered by content + collaborative filtering</Badge>
        </div>
        {recQ.isLoading ? <div className="text-muted-foreground">Analyzing your profile…</div> :
          recQ.data && recQ.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recQ.data.slice(0, 6).map(({ event, score }) => <EventCard key={event.id} event={event as any} score={score} />)}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Add skills and interests to your profile to unlock recommendations.</p>
              <Link to="/profile"><Button className="mt-4 bg-gradient-brand text-white">Update profile</Button></Link>
            </Card>
          )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Saved events</h2>
        {dash?.saved && dash.saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dash.saved.map((e: any) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="text-muted-foreground">Nothing saved yet. <Link to="/events" className="text-primary">Browse events</Link>.</div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Applied events</h2>
        {dash?.applied && dash.applied.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dash.applied.map((a: any) => a.events && <EventCard key={a.event_id} event={a.events} />)}
          </div>
        ) : (
          <div className="text-muted-foreground">Apply to your first event to earn +10 XP.</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Your badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {dash?.badges?.length ? dash.badges.map((b: any) => {
            const Icon = (Icons as any)[b.badges?.icon ?? "Award"] ?? Icons.Award;
            return (
              <Card key={b.badge_id} className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shrink-0"><Icon className="h-6 w-6 text-white" /></div>
                <div>
                  <div className="font-semibold text-sm">{b.badges?.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{b.badges?.description}</div>
                </div>
              </Card>
            );
          }) : <div className="text-muted-foreground col-span-full">Earn badges by applying to events and uploading certificates.</div>}
        </div>
      </section>
    </main>
  );
}

function StatBadge({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2 backdrop-blur">
      <Icon className="h-4 w-4" />
      <div className="text-xs text-white/70">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
function MiniStat({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-brand grid place-items-center"><Icon className="h-5 w-5 text-white" /></div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}
