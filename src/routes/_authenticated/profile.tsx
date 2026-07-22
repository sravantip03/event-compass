import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyDashboard, updateProfile, addCertificate } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — EventCompass AI" }, { name: "description", content: "Manage your skills, interests, and certificates." }] }),
  component: Profile,
});

function Profile() {
  const dashFn = useServerFn(getMyDashboard);
  const upFn = useServerFn(updateProfile);
  const certFn = useServerFn(addCertificate);
  const qc = useQueryClient();
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });

  const [form, setForm] = useState<any>({});
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [certForm, setCertForm] = useState({ title: "", issuer: "", issue_date: "", file_url: "" });

  useEffect(() => {
    if (dashQ.data?.profile) {
      setForm({
        full_name: dashQ.data.profile.full_name ?? "",
        college: dashQ.data.profile.college ?? "",
        branch: dashQ.data.profile.branch ?? "",
        year: dashQ.data.profile.year ?? "",
        bio: dashQ.data.profile.bio ?? "",
        linkedin_url: dashQ.data.profile.linkedin_url ?? "",
        github_url: dashQ.data.profile.github_url ?? "",
        skills: dashQ.data.profile.skills ?? [],
        interests: dashQ.data.profile.interests ?? [],
        preferred_locations: dashQ.data.profile.preferred_locations ?? [],
      });
    }
  }, [dashQ.data]);

  const saveMut = useMutation({
    mutationFn: () => upFn({ data: form }),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["recommendations"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const certMut = useMutation({
    mutationFn: () => certFn({ data: { ...certForm, issue_date: certForm.issue_date || undefined } }),
    onSuccess: () => { toast.success("Certificate added"); setCertForm({ title: "", issuer: "", issue_date: "", file_url: "" }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addTag = (key: "skills" | "interests" | "preferred_locations", val: string, setter: (v: string) => void) => {
    if (!val.trim()) return;
    setForm({ ...form, [key]: [...(form[key] ?? []), val.trim()] });
    setter("");
  };
  const removeTag = (key: "skills" | "interests" | "preferred_locations", i: number) =>
    setForm({ ...form, [key]: form[key].filter((_: any, idx: number) => idx !== i) });

  if (!dashQ.data) return <div className="p-10 text-center">Loading…</div>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your profile</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Basic info</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="College"><Input value={form.college ?? ""} onChange={(e) => setForm({ ...form, college: e.target.value })} /></Field>
          <Field label="Branch"><Input value={form.branch ?? ""} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" /></Field>
          <Field label="Year"><Input value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="3rd year" /></Field>
          <Field label="LinkedIn"><Input value={form.linkedin_url ?? ""} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
          <Field label="GitHub"><Input value={form.github_url ?? ""} onChange={(e) => setForm({ ...form, github_url: e.target.value })} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Bio"><Textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></Field>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">For better recommendations</h2>
        <p className="text-sm text-muted-foreground mb-4">Add skills, interests, and preferred cities. The AI uses these to match events.</p>
        <TagField label="Skills" tags={form.skills ?? []} onAdd={(v) => addTag("skills", v, setSkillInput)} onRemove={(i) => removeTag("skills", i)} input={skillInput} setInput={setSkillInput} placeholder="Python, ML, Web Dev" />
        <TagField label="Interests" tags={form.interests ?? []} onAdd={(v) => addTag("interests", v, setInterestInput)} onRemove={(i) => removeTag("interests", i)} input={interestInput} setInput={setInterestInput} placeholder="AI, Blockchain, Design" />
        <TagField label="Preferred cities" tags={form.preferred_locations ?? []} onAdd={(v) => addTag("preferred_locations", v, setLocInput)} onRemove={(i) => removeTag("preferred_locations", i)} input={locInput} setInput={setLocInput} placeholder="Bangalore, Mumbai" />
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="bg-gradient-brand text-white">
        {saveMut.isPending ? "Saving..." : "Save profile"}
      </Button>

      <Card className="p-6 mt-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Certificates</h2>
        <div className="space-y-3 mb-6">
          {dashQ.data.certificates?.length ? dashQ.data.certificates.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.issuer} · verify: {c.verification_code}</div>
              </div>
              {c.file_url && <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">View</a>}
            </div>
          )) : <div className="text-sm text-muted-foreground">No certificates yet.</div>}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Certificate title" value={certForm.title} onChange={(e) => setCertForm({ ...certForm, title: e.target.value })} />
          <Input placeholder="Issuer" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} />
          <Input type="date" value={certForm.issue_date} onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} />
          <Input placeholder="File URL (optional)" value={certForm.file_url} onChange={(e) => setCertForm({ ...certForm, file_url: e.target.value })} />
        </div>
        <Button onClick={() => certForm.title && certMut.mutate()} disabled={!certForm.title || certMut.isPending} variant="outline" className="mt-3">
          <Plus className="h-4 w-4 mr-2" />Add certificate
        </Button>
      </Card>
    </main>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}

function TagField({ label, tags, onAdd, onRemove, input, setInput, placeholder }: any) {
  return (
    <div className="mb-4">
      <Label className="mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t: string, i: number) => (
          <Badge key={i} className="pl-3 pr-1 py-1 gap-1 bg-secondary text-secondary-foreground">
            {t}
            <button onClick={() => onRemove(i)} className="h-4 w-4 rounded hover:bg-destructive/20 grid place-items-center"><Trash2 className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(input); }}} placeholder={placeholder} />
        <Button type="button" variant="outline" onClick={() => onAdd(input)}>Add</Button>
      </div>
    </div>
  );
}
