import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventBySlug, getRelatedEvents, toggleSaveEvent, markAttended } from "@/lib/events.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar, MapPin, Trophy, Users, ExternalLink, Bookmark, Share2, ArrowLeft,
  Clock, Globe, Phone, Mail, Instagram, Linkedin, MessageCircle, FileText, Download,
  CheckCircle2, CalendarPlus, Copy, Gift, Plane, Target, GraduationCap, Wrench,
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { EventCard } from "@/components/EventCard";

const eventQuery = (slug: string) =>
  queryOptions({ queryKey: ["event", slug], queryFn: () => getEventBySlug({ data: { slug } }) });
const relatedQuery = (slug: string) =>
  queryOptions({ queryKey: ["event", slug, "related"], queryFn: () => getRelatedEvents({ data: { slug } }) });

export const Route = createFileRoute("/events/$slug")({
  head: ({ loaderData }) => {
    const e = loaderData as any;
    if (!e) return { meta: [{ title: "Event — EventCompass AI" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${e.title} — EventCompass AI` },
        { name: "description", content: e.short_description ?? String(e.description ?? "").slice(0, 155) },
        { property: "og:title", content: e.title },
        { property: "og:description", content: e.short_description ?? "" },
        ...(e.image_url ? [{ property: "og:image", content: e.image_url }, { name: "twitter:image", content: e.image_url }] : []),
      ],
    };
  },
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(eventQuery(params.slug));
    if (!data) throw notFound();
    context.queryClient.prefetchQuery(relatedQuery(params.slug));
    return data;
  },
  errorComponent: ({ error }) => (
    <div className="p-20 text-center">
      <div className="text-lg font-semibold">Something went wrong loading this event.</div>
      <div className="text-sm text-muted-foreground mt-2">{error.message}</div>
      <Link to="/events" className="text-primary mt-4 inline-block">Back to events</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-20 text-center">
      Event not found. <Link to="/events" className="text-primary">Back to events</Link>
    </div>
  ),
  component: EventDetail,
});

function computeStatus(e: any): { label: string; tone: string } {
  if (e.status) {
    const map: Record<string, string> = {
      upcoming: "bg-blue-500", registration_open: "bg-emerald-500", registration_closed: "bg-amber-500",
      live: "bg-rose-500", completed: "bg-slate-500", cancelled: "bg-red-600",
    };
    return { label: e.status.replace(/_/g, " "), tone: map[e.status] ?? "bg-slate-500" };
  }
  const now = new Date();
  const start = new Date(e.start_date);
  const end = e.end_date ? new Date(e.end_date) : start;
  const regClose = e.registration_deadline ? new Date(e.registration_deadline) : null;
  if (now > end) return { label: "Completed", tone: "bg-slate-500" };
  if (now >= start && now <= end) return { label: "Live", tone: "bg-rose-500" };
  if (regClose && now > regClose) return { label: "Registration closed", tone: "bg-amber-500" };
  return { label: "Registration open", tone: "bg-emerald-500" };
}

function buildCalendarUrl(e: any) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const start = fmt(e.start_date);
  const end = fmt(e.end_date ?? e.start_date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${start}/${end}`,
    details: (e.short_description ?? "") + "\n\n" + (e.registration_url ?? ""),
    location: [e.venue_name, e.venue_address, e.city, e.state, e.country].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function EventDetail() {
  const { slug } = Route.useParams();
  const { data: e } = useSuspenseQuery(eventQuery(slug));
  const relatedQ = useQuery(relatedQuery(slug));
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveFn = useServerFn(toggleSaveEvent);
  
  const attendFn = useServerFn(markAttended);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId || !e) return;
    supabase.from("saved_events").select("*").eq("user_id", userId).eq("event_id", e.id).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [userId, e]);

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { eventId: e!.id } }),
    onSuccess: (r) => { setSaved(r.saved); toast.success(r.saved ? "Event saved" : "Removed"); },
    onError: () => toast.error("Sign in to save events"),
  });


  const attendMut = useMutation({
    mutationFn: () => attendFn({ data: { eventId: e!.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["history"] }); toast.success("Marked as attended — +25 XP!"); },
    onError: () => toast.error("Sign in to track attendance"),
  });

  if (!e) return null;
  const status = computeStatus(e);
  const eventEnded = isPast(new Date(e.end_date ?? e.start_date));

  const navigate = useNavigate();
  const handleApply = () => {
    if (!userId) { navigate({ to: "/auth" }); return; }
    navigate({ to: "/events/$slug/apply", params: { slug: e.slug } });
  };

  const copyRegLink = () => {
    navigator.clipboard.writeText(e.registration_url);
    toast.success("Registration link copied");
  };

  const share = () => {
    if (navigator.share) navigator.share({ title: e.title, url: window.location.href }).catch(() => {});
    else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }
  };

  const downloads: Array<[string, string | null]> = [
    ["Brochure", e.brochure_url],
    ["Rule book", e.rulebook_url],
    ["Problem statement", e.problem_statement_url],
    ["Schedule", e.schedule_url],
  ];
  const hasDownloads = downloads.some(([, v]) => v);

  const contactRows: Array<[any, string, string | null, string?]> = [
    [Phone, "Phone", e.phone, e.phone ? `tel:${e.phone}` : undefined],
    [Mail, "Email", e.contact_email, e.contact_email ? `mailto:${e.contact_email}` : undefined],
    [Globe, "Website", e.official_website, e.official_website ?? undefined],
    [Instagram, "Instagram", e.instagram_url, e.instagram_url ?? undefined],
    [Linkedin, "LinkedIn", e.linkedin_url, e.linkedin_url ?? undefined],
    [MessageCircle, "Discord", e.discord_url, e.discord_url ?? undefined],
  ];
  const hasContact = contactRows.some(([, , v]) => v);

  return (
    <main>
      {/* Banner */}
      <div className="relative h-[280px] md:h-[440px] overflow-hidden bg-muted">
        {e.image_url && <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link to="/events"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />All events</Button></Link>
        </div>
        <div className="absolute top-4 right-4">
          <Badge className={`${status.tone} text-white border-0 capitalize`}>{status.label}</Badge>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 -mt-24 relative z-10">
        {/* Header card */}
        <div className="rounded-3xl bg-card border shadow-card p-6 md:p-10">
          <div className="flex items-start gap-5">
            {e.logo_url && (
              <img src={e.logo_url} alt="" className="h-20 w-20 rounded-2xl border object-cover bg-background shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-gradient-brand text-white border-0">{e.event_type}</Badge>
                {e.category && <Badge variant="outline">{e.category}</Badge>}
                <Badge variant="outline">{e.mode}</Badge>
                {e.difficulty && <Badge variant="outline">{e.difficulty}</Badge>}
                {e.is_free ? <Badge className="bg-emerald-500 text-white border-0">Free</Badge> : <Badge>₹{e.price}</Badge>}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">{e.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                by <span className="font-medium text-foreground">{e.organizer}</span>{e.college ? ` · ${e.college}` : ""}
              </p>
              {e.short_description && <p className="text-lg text-muted-foreground mt-3">{e.short_description}</p>}
            </div>
          </div>

          {/* Primary actions */}
          <div className="grid md:grid-cols-2 gap-3 mt-8">
            <Button size="lg" onClick={handleApply} className="bg-gradient-brand text-white shadow-glow h-14 text-base">
              <ExternalLink className="h-5 w-5 mr-2" />Apply Now
            </Button>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => saveMut.mutate()}>
                <Bookmark className={`h-4 w-4 mr-2 ${saved ? "fill-primary text-primary" : ""}`} />{saved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" onClick={share}><Share2 className="h-4 w-4 mr-2" />Share</Button>
              <a href={buildCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="col-span-1">
                <Button variant="outline" className="w-full"><CalendarPlus className="h-4 w-4 mr-2" />Calendar</Button>
              </a>
              <Button variant="outline" onClick={copyRegLink}><Copy className="h-4 w-4 mr-2" />Copy link</Button>
            </div>
          </div>
          {eventEnded && userId && (
            <div className="mt-4">
              <Button variant="secondary" onClick={() => attendMut.mutate()} className="w-full md:w-auto">
                <CheckCircle2 className="h-4 w-4 mr-2" />Mark as attended (+25 XP)
              </Button>
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-[1fr,340px] gap-6 mt-8">
          <div className="space-y-6">
            <Section title="About the event">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{e.description}</p>
            </Section>

            {e.theme && <Section title="Theme" icon={Target}><p className="text-muted-foreground whitespace-pre-line">{e.theme}</p></Section>}
            {e.eligibility && <Section title="Eligibility" icon={GraduationCap}><p className="text-muted-foreground whitespace-pre-line">{e.eligibility}</p></Section>}
            {e.prerequisites && <Section title="Prerequisites" icon={Wrench}><p className="text-muted-foreground whitespace-pre-line">{e.prerequisites}</p></Section>}

            {(e.tech_tags?.length || e.branch_tags?.length) ? (
              <Section title="Skills & tracks">
                {e.tech_tags?.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Technologies</div>
                    <div className="flex flex-wrap gap-2">{e.tech_tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                  </div>
                )}
                {e.branch_tags?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">For branches</div>
                    <div className="flex flex-wrap gap-2">{e.branch_tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                  </div>
                )}
              </Section>
            ) : null}

            {(e.venue_name || e.venue_address || e.city || (e.latitude && e.longitude)) && e.mode !== "Online" && (
              <Section title="Venue" icon={MapPin}>
                <div className="text-sm space-y-1">
                  {e.venue_name && <div className="font-semibold">{e.venue_name}</div>}
                  {e.venue_address && <div className="text-muted-foreground">{e.venue_address}</div>}
                  <div className="text-muted-foreground">
                    {[e.city, e.state, e.country].filter(Boolean).join(", ")}
                  </div>
                </div>
                {e.latitude && e.longitude && (
                  <iframe
                    title="Map"
                    className="mt-4 w-full h-72 rounded-xl border"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.longitude - 0.02}%2C${e.latitude - 0.02}%2C${e.longitude + 0.02}%2C${e.latitude + 0.02}&layer=mapnik&marker=${e.latitude}%2C${e.longitude}`}
                  />
                )}
                {(e.venue_address || e.city) && (
                  <a
                    className="inline-flex items-center gap-1 text-sm text-primary mt-3"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue_name, e.venue_address, e.city, e.state, e.country].filter(Boolean).join(", "))}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />Open in Google Maps
                  </a>
                )}
              </Section>
            )}

            {hasDownloads && (
              <Section title="Downloads" icon={FileText}>
                <div className="grid sm:grid-cols-2 gap-2">
                  {downloads.map(([label, url]) => url ? (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/50 hover:bg-secondary/50 transition-colors">
                      <Download className="h-4 w-4 text-primary" /><span className="flex-1">{label}</span>
                    </a>
                  ) : null)}
                </div>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">Key dates</div>
              <div className="space-y-2 text-sm">
                <DateRow icon={Calendar} label="Registration opens" value={e.registration_opens_at} />
                <DateRow icon={Clock} label="Registration closes" value={e.registration_deadline} />
                <DateRow icon={Calendar} label="Event starts" value={e.start_date} required />
                <DateRow icon={Calendar} label="Event ends" value={e.end_date} />
                <DateRow icon={Trophy} label="Results" value={e.result_date} />
                <DateRow icon={GraduationCap} label="Certificates" value={e.certificate_date} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">Fees & rewards</div>
              <div className="space-y-2 text-sm">
                <Row label="Registration fee" value={e.is_free ? "Free" : `₹${e.price ?? 0}`} />
                {e.prize_pool ? <Row label="Prize pool" value={`₹${e.prize_pool.toLocaleString("en-IN")}`} icon={Trophy} /> : null}
                {e.goodies && <Row label="Goodies" value={e.goodies} icon={Gift} />}
                {e.travel_support && <Row label="Travel support" value={e.travel_support} icon={Plane} />}
                {e.seats_left != null && <Row label="Seats left" value={String(e.seats_left)} icon={Users} />}
              </div>
            </Card>

            {hasContact && (
              <Card className="p-5">
                <div className="text-sm font-semibold mb-3">Contact</div>
                <div className="space-y-2 text-sm">
                  {contactRows.map(([Icon, label, val, href]) => val ? (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">{label}:</span>
                      <span className="truncate">{val}</span>
                    </a>
                  ) : null)}
                </div>
              </Card>
            )}
          </aside>
        </div>

        {/* Related */}
        {(relatedQ.data?.length ?? 0) > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-4">Related events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedQ.data!.map((r: any) => <EventCard key={r.id} event={r} />)}
            </div>
          </div>
        )}
      </div>
      <div className="h-20" />
    </main>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}{title}
      </h2>
      {children}
    </Card>
  );
}

function DateRow({ icon: Icon, label, value, required }: { icon: any; label: string; value: string | null; required?: boolean }) {
  if (!value && !required) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value ? format(new Date(value), "PPP") : "TBA"}</div>
      </div>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground inline-flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
