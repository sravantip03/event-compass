import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventBySlug, toggleSaveEvent, applyToEvent } from "@/lib/events.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Users, ExternalLink, Bookmark, Share2, ArrowLeft, Clock, Globe } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

const eventQuery = (slug: string) => queryOptions({ queryKey: ["event", slug], queryFn: () => getEventBySlug({ data: { slug } }) });

export const Route = createFileRoute("/events/$slug")({
  head: ({ loaderData }) => {
    const e = loaderData as any;
    if (!e) return { meta: [{ title: "Event — EventCompass AI" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${e.title} — EventCompass AI` },
        { name: "description", content: e.short_description ?? e.description.slice(0, 155) },
        { property: "og:title", content: e.title },
        { property: "og:description", content: e.short_description ?? "" },
        ...(e.image_url ? [{ property: "og:image", content: e.image_url }, { name: "twitter:image", content: e.image_url }] : []),
      ],
    };
  },
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(eventQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  notFoundComponent: () => <div className="p-20 text-center">Event not found. <Link to="/events" className="text-primary">Back to events</Link></div>,
  component: EventDetail,
});

function EventDetail() {
  const { slug } = Route.useParams();
  const { data: e } = useSuspenseQuery(eventQuery(slug));
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveFn = useServerFn(toggleSaveEvent);
  const applyFn = useServerFn(applyToEvent);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId || !e) return;
    supabase.from("saved_events").select("*").eq("user_id", userId).eq("event_id", e.id).maybeSingle().then(({ data }) => setSaved(!!data));
  }, [userId, e]);

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { eventId: e!.id } }),
    onSuccess: (r) => { setSaved(r.saved); toast.success(r.saved ? "Saved" : "Removed"); },
    onError: () => toast.error("Sign in to save events"),
  });
  const applyMut = useMutation({
    mutationFn: () => applyFn({ data: { eventId: e!.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Marked as applied — +10 XP earned!"); },
    onError: () => toast.error("Sign in to apply"),
  });

  if (!e) return null;

  const handleApply = () => {
    if (userId) applyMut.mutate();
    window.open(e.registration_url, "_blank", "noopener,noreferrer");
  };

  return (
    <main>
      <div className="relative h-[300px] md:h-[420px] overflow-hidden bg-muted">
        {e.image_url && <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link to="/events"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 -mt-24 relative z-10">
        <div className="rounded-3xl bg-card border shadow-card p-6 md:p-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-gradient-brand text-white border-0">{e.event_type}</Badge>
            <Badge variant="outline">{e.mode}</Badge>
            {e.difficulty && <Badge variant="outline">{e.difficulty}</Badge>}
            {e.is_free ? <Badge className="bg-emerald-500 text-white border-0">Free</Badge> : <Badge>₹{e.price}</Badge>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{e.title}</h1>
          <p className="text-lg text-muted-foreground mt-3">{e.short_description}</p>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-3">
              <InfoRow icon={Calendar} label="Starts" value={format(new Date(e.start_date), "PPP p")} />
              {e.end_date && <InfoRow icon={Clock} label="Ends" value={format(new Date(e.end_date), "PPP p")} />}
              {e.registration_deadline && <InfoRow icon={Clock} label="Register by" value={format(new Date(e.registration_deadline), "PPP")} />}
              <InfoRow icon={MapPin} label="Location" value={e.mode === "Online" ? "Online worldwide" : `${e.city ?? ""}${e.state ? ", " + e.state : ""}`} />
              <InfoRow icon={Users} label="Organizer" value={e.organizer + (e.college ? ` · ${e.college}` : "")} />
              {e.prize_pool && e.prize_pool > 0 ? <InfoRow icon={Trophy} label="Prize pool" value={`₹${e.prize_pool.toLocaleString("en-IN")}`} /> : null}
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleApply} className="bg-gradient-brand text-white shadow-glow"><ExternalLink className="h-4 w-4 mr-2" />Apply on official site</Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => saveMut.mutate()}><Bookmark className={`h-4 w-4 mr-2 ${saved ? "fill-primary text-primary" : ""}`} />{saved ? "Saved" : "Save"}</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}><Share2 className="h-4 w-4 mr-2" />Share</Button>
              </div>
              {e.official_website && <a href={e.official_website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-2"><Globe className="h-4 w-4" />Official website</a>}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-3">About this event</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{e.description}</p>
          </div>

          {(e.tech_tags?.length || e.branch_tags?.length) && (
            <div className="mt-8 space-y-4">
              {e.tech_tags?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Technologies</div>
                  <div className="flex flex-wrap gap-2">{e.tech_tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                </div>
              )}
              {e.branch_tags?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">For branches</div>
                  <div className="flex flex-wrap gap-2">{e.branch_tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                </div>
              )}
            </div>
          )}

          {e.latitude && e.longitude && e.mode !== "Online" && (
            <div className="mt-8">
              <div className="text-sm font-semibold mb-2">Venue</div>
              <iframe
                title="Map"
                className="w-full h-72 rounded-xl border"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.longitude - 0.02}%2C${e.latitude - 0.02}%2C${e.longitude + 0.02}%2C${e.latitude + 0.02}&layer=mapnik&marker=${e.latitude}%2C${e.longitude}`}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-20" />
    </main>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
