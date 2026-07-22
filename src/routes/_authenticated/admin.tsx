import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { isAdmin, listEvents, adminUpsertEvent, adminDeleteEvent } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — EventCompass AI" }, { name: "description", content: "Admin panel for managing events." }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const adminFn = useServerFn(isAdmin);
  const listFn = useServerFn(listEvents);
  const upsertFn = useServerFn(adminUpsertEvent);
  const delFn = useServerFn(adminDeleteEvent);
  const qc = useQueryClient();

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => adminFn() });
  const eventsQ = useQuery({ queryKey: ["events", "all"], queryFn: () => listFn(), enabled: !!adminQ.data });

  const [form, setForm] = useState<any>({ mode: "Online", event_type: "Hackathon", is_free: true, is_approved: true, branch_tags: [], tech_tags: [] });

  const save = useMutation({
    mutationFn: () => upsertFn({ data: form }),
    onSuccess: () => { toast.success("Event saved"); qc.invalidateQueries({ queryKey: ["events"] }); setForm({ mode: "Online", event_type: "Hackathon", is_free: true, is_approved: true, branch_tags: [], tech_tags: [] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["events"] }); },
  });

  if (adminQ.isLoading) return <div className="p-10 text-center">Loading…</div>;
  if (!adminQ.data) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-xl font-semibold">Admin access required</h1>
      <p className="text-sm text-muted-foreground mt-2">Ask an admin to grant you the admin role in the database.</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Shield className="h-7 w-7 text-primary" />Admin panel</h1>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4"><Plus className="h-4 w-4 inline mr-1" />Create / edit event</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Organizer" value={form.organizer ?? ""} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
          <Input placeholder="College" value={form.college ?? ""} onChange={(e) => setForm({ ...form, college: e.target.value })} />
          <Input placeholder="City" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="State" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <option>Online</option><option>Offline</option><option>Hybrid</option>
          </select>
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
            <option>Hackathon</option><option>Workshop</option><option>Conference</option><option>Bootcamp</option><option>Competition</option><option>Webinar</option><option>Tech Talk</option>
          </select>
          <Input type="datetime-local" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input placeholder="Registration URL" value={form.registration_url ?? ""} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} />
          <Input placeholder="Image URL" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <Input placeholder="Prize pool (₹)" type="number" value={form.prize_pool ?? ""} onChange={(e) => setForm({ ...form, prize_pool: Number(e.target.value) })} />
        </div>
        <div className="mt-3">
          <Label>Description</Label>
          <Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="mt-3">
          <Label>Short description</Label>
          <Input value={form.short_description ?? ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
        </div>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <Input placeholder="Tech tags (comma separated)" onChange={(e) => setForm({ ...form, tech_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <Input placeholder="Branch tags (comma separated)" onChange={(e) => setForm({ ...form, branch_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 bg-gradient-brand text-white">Save event</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">All events ({eventsQ.data?.length ?? 0})</h2>
        <div className="space-y-2">
          {eventsQ.data?.map((e) => (
            <div key={e.id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.event_type} · {e.mode} · {e.city ?? "Online"}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setForm(e)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => del.mutate(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
