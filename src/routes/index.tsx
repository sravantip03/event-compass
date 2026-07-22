import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getFeaturedEvents, listEvents } from "@/lib/events.functions";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Trophy, Rocket, MapPin, Zap, BrainCircuit, GraduationCap } from "lucide-react";
import { useState } from "react";

const featuredQuery = queryOptions({ queryKey: ["events", "featured"], queryFn: () => getFeaturedEvents() });
const allEventsQuery = queryOptions({ queryKey: ["events", "all"], queryFn: () => listEvents() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EventCompass AI — Discover Hackathons, Workshops & Tech Events" },
      { name: "description", content: "AI-powered platform to discover hackathons, workshops, bootcamps, and coding competitions tailored to your interests, branch, and location." },
      { property: "og:title", content: "EventCompass AI — Smart tech event discovery" },
      { property: "og:description", content: "Personalized recommendations for hackathons, workshops, and coding competitions." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQuery);
    context.queryClient.ensureQueryData(allEventsQuery);
  },
  component: Home,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQuery);
  const { data: all } = useSuspenseQuery(allEventsQuery);
  const [q, setQ] = useState("");
  const trending = [...all].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const hackathons = all.filter((e) => e.event_type === "Hackathon").slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" aria-hidden />
        <div className="absolute inset-0 opacity-30" aria-hidden style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0.5px, transparent 0.5px), radial-gradient(circle at 70% 70%, white 0.5px, transparent 0.5px)", backgroundSize: "60px 60px" }} />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-28 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />Powered by AI recommendations
          </div>
          <h1 className="mt-6 font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Find your next<br />
            <span className="italic font-normal">hackathon, workshop</span> <br />or breakthrough.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-white/85">
            EventCompass AI curates hackathons, bootcamps, and tech events matched to your skills, branch, and location — so you never miss the ones that matter.
          </p>
          <form
            className="mt-10 mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-glow"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/events?q=${encodeURIComponent(q)}`;
            }}
          >
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hackathons, AI, DevOps, IIT Bombay..." className="border-0 bg-transparent text-foreground focus-visible:ring-0" />
            <Button type="submit" className="bg-gradient-brand text-white">Search</Button>
          </form>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {["Hackathons", "AI", "Web3", "Machine Learning", "Cloud", "Design"].map((t) => (
              <Link key={t} to="/events" search={{ q: t } as any} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 hover:bg-white/20">{t}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 -mt-14 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BrainCircuit, label: "AI matching", desc: "Content + collaborative filtering" },
            { icon: MapPin, label: "Near you", desc: "GPS-aware discovery" },
            { icon: Trophy, label: "₹10cr+ prizes", desc: "Live hackathons indexed" },
            { icon: GraduationCap, label: "Verified", desc: "IITs, MLH, Devfolio, MoE" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl bg-card border shadow-card p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-brand grid place-items-center shrink-0"><Icon className="h-5 w-5 text-white" /></div>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-2"><Zap className="h-4 w-4" /> Featured</div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Handpicked events for you</h2>
          </div>
          <Link to="/events"><Button variant="outline">View all</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-16 border-t">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-2"><Rocket className="h-4 w-4" /> Trending</div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">What everyone's applying to</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* Popular hackathons */}
      <section className="mx-auto max-w-7xl px-4 py-16 border-t">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4" /> Hackathons</div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Compete. Build. Win.</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="rounded-3xl bg-gradient-hero p-10 md:p-16 text-white text-center shadow-glow relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to discover your next big event?</h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">Sign up to get personalized recommendations, save events, track certificates, and earn XP as you grow.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="bg-white text-primary hover:bg-white/90">Get started free</Button></Link>
            <Link to="/events"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">Browse events</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-display font-bold text-lg">EventCompass<span className="text-gradient"> AI</span></div>
            <p className="text-muted-foreground mt-2">Smart discovery for the next generation of technologists.</p>
          </div>
          <div>
            <div className="font-semibold mb-3">Explore</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/auth">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Categories</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>Hackathons</li><li>Workshops</li><li>Conferences</li><li>Bootcamps</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">About</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>FAQ</li><li>Contact</li><li>Privacy</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">© 2026 EventCompass AI. Built for students.</div>
      </footer>
    </main>
  );
}
