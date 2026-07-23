import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyDashboard } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Eye, Download, ShieldCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "My certificates — EventCompass AI" },
      { name: "description", content: "All your event certificates in one verifiable place." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const dashFn = useServerFn(getMyDashboard);
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const certs: any[] = dashQ.data?.certificates ?? [];
  const years = useMemo(() => Array.from(new Set(certs.map((c) => c.issue_date ? new Date(c.issue_date).getFullYear() : null).filter(Boolean))) as number[], [certs]);
  const types = useMemo(() => Array.from(new Set(certs.map((c) => c.events?.event_type).filter(Boolean))) as string[], [certs]);

  const filtered = certs.filter((c) => {
    if (q && !`${c.title} ${c.issuer ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (year !== "all" && (!c.issue_date || new Date(c.issue_date).getFullYear() !== Number(year))) return false;
    if (type !== "all" && c.events?.event_type !== type) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
        <Award className="h-8 w-8 text-primary" />My certificates
      </h1>
      <p className="text-muted-foreground mt-1">{certs.length} verified certificate{certs.length === 1 ? "" : "s"}.</p>

      <div className="flex flex-col md:flex-row gap-3 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search certificates…" className="pl-10" />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">All years</option>
          {years.sort((a, b) => b - a).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground mt-8">No certificates yet. Add one from your profile page.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {filtered.map((c) => (
            <Card key={c.id} className="overflow-hidden group">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b relative grid place-items-center">
                {c.file_url ? (
                  /\.(png|jpg|jpeg|webp|gif)$/i.test(c.file_url) ? (
                    <img src={c.file_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : <Award className="h-16 w-16 text-primary/50" />
                ) : <Award className="h-16 w-16 text-primary/50" />}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500 text-white border-0 gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="font-semibold line-clamp-1">{c.title}</div>
                <div className="text-xs text-muted-foreground">by {c.issuer ?? c.events?.organizer ?? "Issuer"}</div>
                <div className="text-xs text-muted-foreground">
                  {c.issue_date ? format(new Date(c.issue_date), "PPP") : "Date not set"}
                </div>
                {c.verification_code && (
                  <div className="text-[10px] font-mono text-muted-foreground truncate">ID: {c.verification_code}</div>
                )}
                <div className="flex gap-2 pt-2">
                  {c.file_url ? (
                    <>
                      <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="flex-1"><Button size="sm" variant="outline" className="w-full"><Eye className="h-3.5 w-3.5 mr-1" />View</Button></a>
                      <a href={c.file_url} download className="flex-1"><Button size="sm" variant="outline" className="w-full"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button></a>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" disabled>No file attached</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => {
                    if (c.verification_code) { navigator.clipboard.writeText(c.verification_code); toast.success("Verification ID copied"); }
                    else toast.error("No verification code");
                  }}><ShieldCheck className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
