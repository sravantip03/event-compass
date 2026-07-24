import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications } from "@/lib/applications.functions";
import { getMyDashboard } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Award, Calendar, MapPin, Trophy, Download, Eye, Search, Filter } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/attended")({
  head: () => ({
    meta: [
      { title: "My history — EventCompass AI" },
      { name: "description", content: "Every application, payment, certificate and badge you've earned." },
    ],
  }),
  component: HistoryPage,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-slate-500", submitted: "bg-blue-500", under_review: "bg-amber-500",
  shortlisted: "bg-violet-500", accepted: "bg-emerald-500", rejected: "bg-red-500",
  completed: "bg-slate-700", waitlisted: "bg-orange-500",
};

function HistoryPage() {
  const appsFn = useServerFn(getMyApplications);
  const dashFn = useServerFn(getMyDashboard);
  const appsQ = useQuery({ queryKey: ["my-applications"], queryFn: () => appsFn() });
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const rows: any[] = appsQ.data ?? [];
  const certsByEvent = new Map<string, any>();
  (dashQ.data?.certificates ?? []).forEach((c: any) => { if (c.event_id) certsByEvent.set(c.event_id, c); });

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return r.events?.title?.toLowerCase().includes(t) || r.events?.organizer?.toLowerCase().includes(t);
  }), [rows, q, statusFilter]);

  const stats = [
    ["Total", rows.length],
    ["Accepted", rows.filter((r) => r.status === "accepted").length],
    ["Under review", rows.filter((r) => r.status === "under_review" || r.status === "shortlisted").length],
    ["Rejected", rows.filter((r) => r.status === "rejected").length],
    ["Completed", rows.filter((r) => r.status === "completed").length],
    ["Paid", rows.filter((r) => r.payment_status === "paid").length],
  ];

  const exportCsv = () => {
    const header = ["Application #", "Event", "Type", "Status", "Payment", "Amount", "Transaction ID", "Applied on"];
    const lines = [header.join(",")];
    filtered.forEach((r) => {
      const p = r.payments?.[0];
      lines.push([
        r.application_number, `"${r.events?.title ?? ""}"`, r.events?.event_type ?? "",
        r.status, r.payment_status, r.amount, p?.transaction_id ?? "",
        format(new Date(r.created_at), "yyyy-MM-dd"),
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "eventcompass-history.csv"; a.click();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">My history</h1>
      <p className="text-muted-foreground mt-1">Every application, payment and certificate — in one place.</p>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
        {stats.map(([label, val]) => (
          <Card key={label as string} className="p-4">
            <div className="text-2xl font-bold">{val as number}</div>
            <div className="text-xs text-muted-foreground mt-1">{label as string}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mt-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <div className="inline-flex rounded-md border overflow-hidden">
          <button onClick={() => setView("cards")} className={`px-3 py-2 text-sm ${view === "cards" ? "bg-primary text-white" : ""}`}>Cards</button>
          <button onClick={() => setView("table")} className={`px-3 py-2 text-sm ${view === "table" ? "bg-primary text-white" : ""}`}>Table</button>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />CSV</Button>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground mt-6">
          {rows.length === 0 ? "No applications yet." : "No results match your filters."}
          <div className="mt-4"><Link to="/events"><Button variant="outline">Browse events</Button></Link></div>
        </Card>
      ) : view === "cards" ? (
        <div className="mt-6 space-y-4">
          {filtered.map((r) => {
            const e = r.events; if (!e) return null;
            const cert = certsByEvent.get(e.id);
            const p = r.payments?.[0];
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  {e.image_url && <img src={e.image_url} alt="" className="h-24 w-full md:w-40 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge variant="secondary">{e.event_type}</Badge>
                      <Badge className={`${STATUS_TONE[r.status] ?? "bg-slate-500"} text-white border-0 capitalize`}>{r.status.replace(/_/g, " ")}</Badge>
                      <Badge variant={r.payment_status === "paid" ? "default" : "outline"} className="capitalize">{r.payment_status.replace(/_/g, " ")}</Badge>
                      {cert && <Badge className="bg-emerald-500 text-white border-0">Certified</Badge>}
                    </div>
                    <Link to="/events/$slug" params={{ slug: e.slug }} className="font-semibold text-lg hover:text-primary">{e.title}</Link>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{r.application_number}{p ? ` · ${p.transaction_id}` : ""}</div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Applied {format(new Date(r.created_at), "PPP")}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.mode === "Online" ? "Online" : e.city ?? e.mode}</span>
                      {r.amount > 0 && <span className="inline-flex items-center gap-1 font-medium">₹{r.amount}</span>}
                      {r.xp_earned > 0 && <span className="inline-flex items-center gap-1 text-primary"><Trophy className="h-3.5 w-3.5" />+{r.xp_earned} XP</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    <Link to="/application/$id" params={{ id: r.id }}><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />Details</Button></Link>
                    {cert?.file_url && <a href={cert.file_url} download><Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Certificate</Button></a>}
                    <Link to="/badges"><Button size="sm" variant="ghost"><Award className="h-4 w-4 mr-1" />Badges</Button></Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["App #", "Event", "Type", "Status", "Payment", "Amount", "Applied"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.application_number}</td>
                  <td className="px-4 py-3"><Link to="/events/$slug" params={{ slug: r.events?.slug }} className="hover:text-primary">{r.events?.title}</Link></td>
                  <td className="px-4 py-3">{r.events?.event_type}</td>
                  <td className="px-4 py-3"><Badge className={`${STATUS_TONE[r.status]} text-white border-0 capitalize`}>{r.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 capitalize">{r.payment_status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">₹{r.amount}</td>
                  <td className="px-4 py-3">{format(new Date(r.created_at), "PP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
