import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getApplicationById, progressDemoStatus } from "@/lib/applications.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Trophy, Download, Receipt, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

const appQuery = (id: string) => queryOptions({ queryKey: ["application", id], queryFn: () => getApplicationById({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/application/$id")({
  head: () => ({ meta: [{ title: "Application confirmation — EventCompass AI" }, { name: "robots", content: "noindex" }] }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(appQuery(params.id)),
  component: ConfirmationPage,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-slate-500", submitted: "bg-blue-500", under_review: "bg-amber-500",
  shortlisted: "bg-violet-500", accepted: "bg-emerald-500", rejected: "bg-red-500",
  completed: "bg-slate-700", waitlisted: "bg-orange-500",
};

function ConfirmationPage() {
  const { id } = Route.useParams();
  const { data: app } = useSuspenseQuery(appQuery(id));
  const qc = useQueryClient();
  const progressFn = useServerFn(progressDemoStatus);

  // Auto-progress demo status
  useEffect(() => {
    const tick = async () => {
      await progressFn({ data: { applicationId: id } });
      qc.invalidateQueries({ queryKey: ["application", id] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [id, progressFn, qc]);

  if (!app) return null;
  const e: any = (app as any).events;
  const payment: any = (app as any).payments?.[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-brand text-white p-8 text-center shadow-glow">
        <div className="h-16 w-16 rounded-full bg-white/20 grid place-items-center mx-auto animate-in zoom-in duration-500">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mt-4">Application submitted</h1>
        <p className="text-white/85 mt-2">You're all set for <span className="font-semibold">{e.title}</span></p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/15 px-4 py-1.5 rounded-full text-sm font-mono">
          {(app as any).application_number}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
          <Badge className={`${STATUS_TONE[(app as any).status] ?? "bg-slate-500"} text-white border-0 mt-2 capitalize`}>
            {(app as any).status.replace(/_/g, " ")}
          </Badge>
          <p className="text-xs text-muted-foreground mt-3">
            <Clock className="inline h-3 w-3 mr-1" />Your status updates automatically. Refresh this page anytime.
          </p>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Payment</div>
          <Badge variant={(app as any).payment_status === "paid" ? "default" : "outline"} className="mt-2 capitalize">
            {(app as any).payment_status.replace(/_/g, " ")}
          </Badge>
          {payment && (
            <div className="text-xs text-muted-foreground mt-3 space-y-0.5 font-mono">
              <div>TXN: {payment.transaction_id}</div>
              <div>ORD: {payment.order_id}</div>
              <div>INV: {payment.invoice_number}</div>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Event details</div>
        <div className="flex gap-4">
          {e.image_url && <img src={e.image_url} alt="" className="w-24 h-24 rounded-lg object-cover" />}
          <div className="flex-1">
            <div className="font-bold text-lg">{e.title}</div>
            <div className="text-sm text-muted-foreground">{e.organizer}</div>
            <div className="text-sm text-muted-foreground mt-2 inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />{format(new Date(e.start_date), "PPP")}
            </div>
            {e.prize_pool ? (
              <div className="text-sm text-amber-600 mt-1 inline-flex items-center gap-1 font-medium">
                <Trophy className="h-3.5 w-3.5" />₹{Number(e.prize_pool).toLocaleString("en-IN")} prize pool
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 mt-6">
        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${new Date(e.start_date).toISOString().replace(/[-:]|\.\d{3}/g, "")}/${new Date(e.end_date ?? e.start_date).toISOString().replace(/[-:]|\.\d{3}/g, "")}`}
           target="_blank" rel="noopener noreferrer">
          <Button variant="outline"><Calendar className="h-4 w-4 mr-2" />Add to calendar</Button>
        </a>
        {payment && <Button variant="outline"><Receipt className="h-4 w-4 mr-2" />Download receipt</Button>}
        {e.brochure_url && (
          <a href={e.brochure_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Brochure</Button>
          </a>
        )}
        <Link to="/attended"><Button variant="outline">View history<ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
        <Link to="/dashboard"><Button className="bg-gradient-brand text-white">Go to dashboard<ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
      </div>
    </main>
  );
}
