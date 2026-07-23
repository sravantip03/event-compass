import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyHistory, getMyDashboard } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Award, Calendar, MapPin, Trophy, Download, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/attended")({
  head: () => ({
    meta: [
      { title: "My event history — EventCompass AI" },
      { name: "description", content: "Every hackathon, workshop, and conference you've attended." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const histFn = useServerFn(getMyHistory);
  const dashFn = useServerFn(getMyDashboard);
  const histQ = useQuery({ queryKey: ["history"], queryFn: () => histFn() });
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });

  if (histQ.isLoading) return <div className="p-10 text-center">Loading…</div>;
  const rows = histQ.data ?? [];

  const countBy = (type: string) => rows.filter((r: any) => r.events?.event_type === type).length;
  const certsByEvent = new Map<string, any>();
  (dashQ.data?.certificates ?? []).forEach((c: any) => { if (c.event_id) certsByEvent.set(c.event_id, c); });
  const badgesEarned = dashQ.data?.badges ?? [];

  const stats = [
    ["Total attended", rows.length],
    ["Hackathons", countBy("Hackathon")],
    ["Workshops", countBy("Workshop")],
    ["Tech talks", countBy("Tech Talk")],
    ["Conferences", countBy("Conference")],
    ["Bootcamps", countBy("Bootcamp")],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">My event history</h1>
      <p className="text-muted-foreground mt-1">Every event you've attended, in one place.</p>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
        {stats.map(([label, val]) => (
          <Card key={label as string} className="p-4">
            <div className="text-2xl font-bold">{val as number}</div>
            <div className="text-xs text-muted-foreground mt-1">{label as string}</div>
          </Card>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {rows.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No attended events yet. Once an event ends, mark it as attended from its details page.
            <div className="mt-4"><Link to="/events"><Button variant="outline">Browse events</Button></Link></div>
          </Card>
        ) : rows.map((r: any) => {
          const e = r.events; if (!e) return null;
          const cert = certsByEvent.get(e.id);
          return (
            <Card key={r.id} className="p-5">
              <div className="flex flex-col md:flex-row gap-4">
                {e.image_url && <img src={e.image_url} alt="" className="h-24 w-full md:w-40 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <Badge variant="secondary">{e.event_type}</Badge>
                    {cert ? <Badge className="bg-emerald-500 text-white border-0">Certified</Badge> : <Badge variant="outline">No certificate</Badge>}
                  </div>
                  <Link to="/events/$slug" params={{ slug: e.slug }} className="font-semibold text-lg hover:text-primary">{e.title}</Link>
                  <div className="text-sm text-muted-foreground">by {e.organizer}</div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(e.start_date), "PPP")}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.mode === "Online" ? "Online" : e.city ?? e.mode}</span>
                    <span className="inline-flex items-center gap-1 text-primary"><Trophy className="h-3.5 w-3.5" />+25 XP</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                  {cert && (
                    <>
                      {cert.file_url && <a href={cert.file_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />View cert</Button></a>}
                      {cert.file_url && <a href={cert.file_url} download><Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Download</Button></a>}
                    </>
                  )}
                  {badgesEarned.length > 0 && (
                    <Link to="/badges"><Button size="sm" variant="ghost"><Award className="h-4 w-4 mr-1" />Badges</Button></Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
