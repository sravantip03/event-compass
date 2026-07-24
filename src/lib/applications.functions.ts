import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const applySchema = z.object({
  eventId: z.string().uuid(),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  college: z.string().trim().max(200).optional().nullable(),
  university: z.string().trim().max(200).optional().nullable(),
  branch: z.string().trim().max(100).optional().nullable(),
  year: z.string().trim().max(20).optional().nullable(),
  roll_number: z.string().trim().max(50).optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  skills: z.array(z.string()).max(50).default([]),
  languages: z.array(z.string()).max(50).default([]),
  github_url: z.string().trim().url().max(300).optional().or(z.literal("")).nullable(),
  linkedin_url: z.string().trim().url().max(300).optional().or(z.literal("")).nullable(),
  portfolio_url: z.string().trim().url().max(300).optional().or(z.literal("")).nullable(),
  resume_url: z.string().trim().url().max(500).optional().or(z.literal("")).nullable(),
  experience_level: z.string().trim().max(50).optional().nullable(),
  team_name: z.string().trim().max(100).optional().nullable(),
  team_size: z.number().int().min(1).max(20).optional().nullable(),
  team_members: z.array(z.object({ name: z.string(), email: z.string().optional() })).max(20).default([]),
  answers: z.record(z.string(), z.any()).default({}),
  agreed_terms: z.boolean(),
});

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof applySchema>) => applySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.agreed_terms) throw new Error("You must accept the terms.");

    const { data: event, error: evErr } = await (supabase as any)
      .from("events").select("*").eq("id", data.eventId).maybeSingle();
    if (evErr || !event) throw new Error("Event not found");

    if (event.max_seats && event.registered_count >= event.max_seats) {
      throw new Error("This event is full. Join the waitlist from the event page.");
    }

    const amount = event.is_free ? 0 : Number(event.price ?? 0);
    const payment_status = amount > 0 ? "pending" : "not_required";
    const status = amount > 0 ? "pending" : "submitted";

    const { data: existing } = await (supabase as any)
      .from("applications").select("id").eq("user_id", userId).eq("event_id", data.eventId).maybeSingle();
    if (existing) throw new Error("You've already applied to this event.");

    const insert: any = {
      user_id: userId,
      event_id: data.eventId,
      status,
      payment_status,
      amount,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      college: data.college,
      university: data.university,
      branch: data.branch,
      year: data.year,
      roll_number: data.roll_number,
      gender: data.gender,
      skills: data.skills,
      languages: data.languages,
      github_url: data.github_url || null,
      linkedin_url: data.linkedin_url || null,
      portfolio_url: data.portfolio_url || null,
      resume_url: data.resume_url || null,
      experience_level: data.experience_level,
      team_name: data.team_name,
      team_size: data.team_size,
      team_members: data.team_members,
      answers: data.answers,
      agreed_terms: data.agreed_terms,
      xp_earned: amount > 0 ? 0 : 10,
    };

    const { data: app, error } = await (supabase as any)
      .from("applications").insert(insert).select("*").maybeSingle();
    if (error) throw new Error(error.message);

    // Award XP + first_event badge on free apps immediately
    if (amount === 0) {
      const { data: profile } = await supabase.from("profiles").select("xp_points").eq("id", userId).maybeSingle();
      await supabase.from("profiles").update({ xp_points: (profile?.xp_points ?? 0) + 10 }).eq("id", userId);
      const { data: badge } = await supabase.from("badges").select("id").eq("code", "first_event").maybeSingle();
      if (badge) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: badge.id }, { onConflict: "user_id,badge_id" });
    }

    return { ok: true, applicationId: app.id, requiresPayment: amount > 0, amount };
  });

export const processPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string; method: string; simulateSuccess?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app } = await (supabase as any).from("applications")
      .select("*").eq("id", data.applicationId).eq("user_id", userId).maybeSingle();
    if (!app) throw new Error("Application not found");
    if (app.payment_status === "paid") throw new Error("Already paid");

    const success = data.simulateSuccess !== false;
    const nowIso = new Date().toISOString();

    const { data: pay, error } = await (supabase as any).from("payments").insert({
      application_id: app.id,
      user_id: userId,
      amount: app.amount,
      method: data.method,
      status: success ? "paid" : "failed",
      paid_at: success ? nowIso : null,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);

    if (success) {
      await (supabase as any).from("applications").update({
        payment_status: "paid",
        status: "submitted",
        xp_earned: 10,
      }).eq("id", app.id);

      const { data: profile } = await supabase.from("profiles").select("xp_points").eq("id", userId).maybeSingle();
      await supabase.from("profiles").update({ xp_points: (profile?.xp_points ?? 0) + 10 }).eq("id", userId);
      const { data: badge } = await supabase.from("badges").select("id").eq("code", "first_event").maybeSingle();
      if (badge) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: badge.id }, { onConflict: "user_id,badge_id" });
    } else {
      await (supabase as any).from("applications").update({ payment_status: "failed" }).eq("id", app.id);
    }

    return { ok: success, payment: pay };
  });

export const getApplicationById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app } = await (supabase as any).from("applications")
      .select("*, events(*), payments(*)")
      .eq("id", data.id).eq("user_id", userId).maybeSingle();
    return app;
  });

export const getMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase as any).from("applications")
      .select("*, events(*), payments(*)")
      .eq("user_id", userId).order("created_at", { ascending: false });
    return data ?? [];
  });

export const getEventQuestions = createServerFn({ method: "GET" })
  .inputValidator((d: { eventId: string }) => d)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
    const { data: qs } = await (sb as any).from("event_questions")
      .select("*").eq("event_id", data.eventId).order("sort_order", { ascending: true });
    return qs ?? [];
  });

// Demo status progression (called on-demand from confirmation page)
export const progressDemoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app } = await (supabase as any).from("applications")
      .select("id, status, created_at").eq("id", data.applicationId).eq("user_id", userId).maybeSingle();
    if (!app) return { ok: false };
    const ageMin = (Date.now() - new Date(app.created_at).getTime()) / 60000;
    const order = ["submitted", "under_review", "shortlisted", "accepted"];
    const currentIdx = order.indexOf(app.status);
    let target = app.status;
    if (ageMin > 0.2 && currentIdx < 1) target = "under_review";
    if (ageMin > 1 && currentIdx < 2) target = "shortlisted";
    if (ageMin > 3 && currentIdx < 3) target = "accepted";
    if (target !== app.status) {
      await (supabase as any).from("applications").update({ status: target }).eq("id", app.id);
    }
    return { ok: true, status: target };
  });
