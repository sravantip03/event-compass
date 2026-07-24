import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEventBySlug } from "@/lib/events.functions";
import { submitApplication, getEventQuestions } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Users, User, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const evQuery = (slug: string) => queryOptions({ queryKey: ["event", slug], queryFn: () => getEventBySlug({ data: { slug } }) });
const qQuery = (eventId: string) => queryOptions({ queryKey: ["event-questions", eventId], queryFn: () => getEventQuestions({ data: { eventId } }), enabled: !!eventId });

export const Route = createFileRoute("/_authenticated/events/$slug/apply")({
  head: ({ params }) => ({
    meta: [
      { title: `Apply — ${params.slug} — EventCompass AI` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(evQuery(params.slug)),
  component: ApplyPage,
});

function ApplyPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: event } = useSuspenseQuery(evQuery(slug));
  const questionsQ = useQuery(qQuery(event?.id ?? ""));
  const submitFn = useServerFn(submitApplication);
  const [prefill, setPrefill] = useState<any>(null);
  const [form, setForm] = useState<any>({
    full_name: "", email: "", phone: "", college: "", university: "", branch: "", year: "",
    roll_number: "", gender: "", skills: [], languages: [], github_url: "", linkedin_url: "",
    portfolio_url: "", resume_url: "", experience_level: "Beginner",
    team_name: "", team_size: 1, team_members: [],
    answers: {}, agreed_terms: false,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: u }) => {
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (p) {
        setPrefill(p);
        setForm((f: any) => ({
          ...f,
          full_name: p.full_name ?? "",
          email: p.email ?? u.user!.email ?? "",
          college: p.college ?? "",
          branch: p.branch ?? "",
          year: p.year ?? "",
          github_url: p.github_url ?? "",
          linkedin_url: p.linkedin_url ?? "",
          skills: p.skills ?? [],
        }));
      }
    });
  }, []);

  const isTeam = (event as any)?.is_team_based;
  const maxTeam = (event as any)?.max_team_size ?? 4;
  const isFull = event?.max_seats && (event as any).registered_count >= event.max_seats;
  const price = event?.is_free ? 0 : Number(event?.price ?? 0);

  const mutation = useMutation({
    mutationFn: async () => {
      // Basic validation
      const requiredCheck = z.object({
        full_name: z.string().min(2, "Enter full name"),
        email: z.string().email("Valid email required"),
      }).safeParse(form);
      if (!requiredCheck.success) throw new Error(requiredCheck.error.issues[0].message);
      return submitFn({ data: { eventId: event!.id, ...form } as any });
    },
    onSuccess: (res) => {
      if (res.requiresPayment) {
        toast.success("Application saved. Please complete payment.");
        navigate({ to: "/payment/$applicationId", params: { applicationId: res.applicationId } });
      } else {
        toast.success("Application submitted!");
        navigate({ to: "/application/$id", params: { id: res.applicationId } });
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  if (!event) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/events/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="rounded-2xl bg-gradient-brand text-white p-6 mb-6 flex items-center gap-4 shadow-glow">
        {event.logo_url && <img src={event.logo_url} alt="" className="h-14 w-14 rounded-xl bg-white/10 object-cover" />}
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide opacity-80">Application form</div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{event.title}</h1>
          <div className="text-sm opacity-90 mt-1">
            {event.is_free ? "Free registration" : `Registration fee: ₹${price}`} · {event.event_type}
          </div>
        </div>
        <Badge className="bg-white/20 text-white border-0"><Sparkles className="h-3 w-3 mr-1" />XP +10</Badge>
      </div>

      {isFull && (
        <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/5">
          <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">This event is full — applications may be added to a waitlist.</div>
        </Card>
      )}

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <Section title="Personal details" icon={User}>
          <Grid>
            <Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></Field>
            <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Gender">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select…</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
              </select>
            </Field>
            <Field label="College"><Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} /></Field>
            <Field label="University"><Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} /></Field>
            <Field label="Branch"><Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. CSE" /></Field>
            <Field label="Year"><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 3rd" /></Field>
            <Field label="Roll number"><Input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} /></Field>
          </Grid>
        </Section>

        <Section title="Technical details" icon={Sparkles}>
          <Grid>
            <Field label="Experience level">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option>
              </select>
            </Field>
            <Field label="GitHub URL"><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" /></Field>
            <Field label="LinkedIn URL"><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/…" /></Field>
            <Field label="Portfolio URL"><Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Resume URL (link)"><Input value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} placeholder="Google Drive / Dropbox link" /></Field>
          </Grid>
          <div className="mt-4">
            <Label className="text-xs">Skills (comma separated)</Label>
            <Input value={form.skills.join(", ")} onChange={(e) => setForm({ ...form, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="React, Node, ML…" />
          </div>
          <div className="mt-4">
            <Label className="text-xs">Programming languages (comma separated)</Label>
            <Input value={form.languages.join(", ")} onChange={(e) => setForm({ ...form, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="TypeScript, Python…" />
          </div>
        </Section>

        {isTeam && (
          <Section title="Team details" icon={Users}>
            <Grid>
              <Field label="Team name"><Input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} /></Field>
              <Field label="Team size">
                <Input type="number" min={1} max={maxTeam} value={form.team_size ?? 1}
                  onChange={(e) => setForm({ ...form, team_size: Number(e.target.value) })} />
              </Field>
            </Grid>
            <div className="mt-4 space-y-2">
              <Label className="text-xs">Team members (one per line: name, email)</Label>
              <Textarea rows={3} placeholder={"Priya, priya@example.com\nRahul, rahul@example.com"}
                onChange={(e) => {
                  const members = e.target.value.split("\n").map((l) => {
                    const [name, email] = l.split(",").map((s) => s.trim());
                    return name ? { name, email: email ?? "" } : null;
                  }).filter(Boolean);
                  setForm({ ...form, team_members: members });
                }}
              />
            </div>
          </Section>
        )}

        {(questionsQ.data?.length ?? 0) > 0 && (
          <Section title="Event questions">
            <div className="space-y-4">
              {questionsQ.data!.map((q: any) => (
                <div key={q.id}>
                  <Label className="text-sm">{q.label}{q.required && <span className="text-destructive"> *</span>}</Label>
                  {q.field_type === "textarea" ? (
                    <Textarea rows={3} value={form.answers[q.id] ?? ""}
                      onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })} required={q.required} />
                  ) : q.field_type === "select" ? (
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.answers[q.id] ?? ""}
                      onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}>
                      <option value="">Select…</option>
                      {(q.options ?? []).map((o: string) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Input value={form.answers[q.id] ?? ""}
                      onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })} required={q.required} />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Card className="p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={form.agreed_terms} onCheckedChange={(v) => setForm({ ...form, agreed_terms: !!v })} />
            <span className="text-sm text-muted-foreground">
              I agree to the terms & conditions of {event.organizer} and confirm the information above is accurate.
            </span>
          </label>
        </Card>

        <div className="flex items-center justify-between gap-4 sticky bottom-4 rounded-2xl bg-card border shadow-card p-4">
          <div className="text-sm">
            {event.is_free ? (
              <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold"><CheckCircle2 className="h-4 w-4" /> Free registration</span>
            ) : (
              <span className="font-semibold">Total: ₹{price}</span>
            )}
          </div>
          <Button type="submit" size="lg" disabled={!form.agreed_terms || mutation.isPending || !!isFull}
            className="bg-gradient-brand text-white shadow-glow">
            {mutation.isPending ? "Submitting…" : event.is_free ? "Submit application" : `Continue to payment · ₹${price}`}
          </Button>
        </div>
      </form>
    </main>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">{Icon && <Icon className="h-4 w-4 text-primary" />}{title}</h2>
      {children}
    </Card>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid sm:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs mb-1 block">{label}</Label>{children}</div>;
}
