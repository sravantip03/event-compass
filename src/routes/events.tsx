import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listEvents } from "@/lib/events.functions";
import { EventCard } from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });
const allQuery = queryOptions({ queryKey: ["events", "all"], queryFn: () => listEvents() });

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Browse Events — EventCompass AI" },
      { name: "description", content: "Browse hackathons, workshops, bootcamps, conferences and coding competitions. Filter by location, branch, technology and mode." },
      { property: "og:title", content: "Browse Events — EventCompass AI" },
      { property: "og:description", content: "Filter hackathons, workshops, conferences and more." },
    ],
  }),
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(allQuery),
  component: EventsPage,
});

const TYPES = ["Hackathon", "Workshop", "Conference", "Webinar", "Competition", "Bootcamp", "Tech Talk"];
const MODES = ["Online", "Offline", "Hybrid"];
const DIFFS = ["Beginner", "Intermediate", "Advanced"];
const TECHS = ["Python", "Machine Learning", "Deep Learning", "Web Development", "Cloud", "Cyber Security", "DevOps", "Blockchain", "IoT", "AR VR", "App Development", "UI UX", "Data Science", "Java"];

function EventsPage() {
  const { data: events } = useSuspenseQuery(allQuery);
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [types, setTypes] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<"soon" | "popular" | "prize">("soon");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = [...events];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((e) =>
        [e.title, e.description, e.organizer, e.city, ...(e.tech_tags ?? []), ...(e.branch_tags ?? [])]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
      );
    }
    if (types.length) list = list.filter((e) => types.includes(e.event_type));
    if (modes.length) list = list.filter((e) => modes.includes(e.mode));
    if (diffs.length) list = list.filter((e) => e.difficulty && diffs.includes(e.difficulty));
    if (techs.length) list = list.filter((e) => e.tech_tags?.some((t) => techs.includes(t)));
    if (freeOnly) list = list.filter((e) => e.is_free);
    if (sort === "popular") list.sort((a, b) => b.popularity - a.popularity);
    else if (sort === "prize") list.sort((a, b) => (b.prize_pool ?? 0) - (a.prize_pool ?? 0));
    else list.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return list;
  }, [events, q, types, modes, diffs, techs, freeOnly, sort]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Explore events</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} of {events.length} events</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, tech, colleges..." className="pl-10" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border bg-background px-3 text-sm">
          <option value="soon">Nearest date</option>
          <option value="popular">Most popular</option>
          <option value="prize">Prize pool</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm px-3 rounded-md border bg-background">
          <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Free only
        </label>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-8">
        <aside className="space-y-6">
          <FilterGroup title="Event type" options={TYPES} selected={types} onToggle={(v) => toggle(types, setTypes, v)} />
          <FilterGroup title="Mode" options={MODES} selected={modes} onToggle={(v) => toggle(modes, setModes, v)} />
          <FilterGroup title="Difficulty" options={DIFFS} selected={diffs} onToggle={(v) => toggle(diffs, setDiffs, v)} />
          <FilterGroup title="Technology" options={TECHS} selected={techs} onToggle={(v) => toggle(techs, setTechs, v)} />
          <Button variant="outline" size="sm" onClick={() => { setTypes([]); setModes([]); setDiffs([]); setTechs([]); setFreeOnly(false); setQ(""); }} className="w-full">
            <SlidersHorizontal className="h-4 w-4 mr-2" />Clear all
          </Button>
        </aside>
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No events match those filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Badge key={o} onClick={() => onToggle(o)} className={`cursor-pointer ${selected.includes(o) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
            {o}
          </Badge>
        ))}
      </div>
    </div>
  );
}
