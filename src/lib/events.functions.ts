import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function serverPublic() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data, error } = await sb.from("events").select("*").eq("is_approved", true).order("start_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getFeaturedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data, error } = await sb.from("events").select("*").eq("is_approved", true).eq("is_featured", true).order("popularity", { ascending: false }).limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: ev, error } = await sb.from("events").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return ev;
  });

export const getMyDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, saved, applied, certs, badges] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("saved_events").select("event_id, events(*)").eq("user_id", userId),
      supabase.from("applied_events").select("*, events(*)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("certificates").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId),
    ]);
    return {
      profile: profile.data,
      saved: (saved.data ?? []).map((r) => r.events).filter(Boolean),
      applied: applied.data ?? [],
      certificates: certs.data ?? [],
      badges: badges.data ?? [],
    };
  });

export const toggleSaveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("saved_events").select("*").eq("user_id", userId).eq("event_id", data.eventId).maybeSingle();
    if (existing) {
      await supabase.from("saved_events").delete().eq("user_id", userId).eq("event_id", data.eventId);
      return { saved: false };
    }
    await supabase.from("saved_events").insert({ user_id: userId, event_id: data.eventId });
    return { saved: true };
  });

export const applyToEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("applied_events").upsert({ user_id: userId, event_id: data.eventId, status: "applied" }, { onConflict: "user_id,event_id" });
    // Award XP + badges
    const { data: profile } = await supabase.from("profiles").select("xp_points").eq("id", userId).maybeSingle();
    const newXp = (profile?.xp_points ?? 0) + 10;
    await supabase.from("profiles").update({ xp_points: newXp }).eq("id", userId);

    // Auto-award badges
    const { data: appliedList } = await supabase.from("applied_events").select("event_id, events(event_type)").eq("user_id", userId);
    const count = appliedList?.length ?? 0;
    const hackCount = (appliedList ?? []).filter((a: any) => a.events?.event_type === "Hackathon").length;

    const awards: string[] = [];
    if (count >= 1) awards.push("first_event");
    if (hackCount >= 1) awards.push("hackathon_beginner");
    if (hackCount >= 5) awards.push("hackathon_explorer");
    if (newXp >= 100) awards.push("century_club");
    if (newXp >= 500) awards.push("legend");

    for (const code of awards) {
      const { data: badge } = await supabase.from("badges").select("id").eq("code", code).maybeSingle();
      if (badge) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: badge.id }, { onConflict: "user_id,badge_id" });
    }
    return { ok: true, xp: newXp };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name?: string; college?: string; branch?: string; year?: string; bio?: string; linkedin_url?: string; github_url?: string; skills?: string[]; interests?: string[]; preferred_locations?: string[] }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; issuer?: string; issue_date?: string; file_url?: string; event_id?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("certificates").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    // Top learner badge
    const { count } = await supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) >= 3) {
      const { data: b } = await supabase.from("badges").select("id").eq("code", "top_learner").maybeSingle();
      if (b) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: b.id }, { onConflict: "user_id,badge_id" });
    }
    return { ok: true };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    return !!data;
  });

export const adminUpsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = data.id
      ? await supabase.from("events").update(data).eq("id", data.id)
      : await supabase.from("events").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await context.supabase.from("events").delete().eq("id", data.id);
    return { ok: true };
  });
