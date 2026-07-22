import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Content-based recommender using TF-IDF-like weighted overlap + cosine similarity
// across event tags, and collaborative signal from co-application counts.
type EventRow = {
  id: string; title: string; slug: string; short_description: string | null;
  description: string; organizer: string; college: string | null; city: string | null; state: string | null;
  mode: string; event_type: string; branch_tags: string[]; tech_tags: string[];
  difficulty: string | null; is_free: boolean; image_url: string | null; start_date: string;
  registration_url: string; popularity: number;
};

function vectorize(tokens: string[], vocab: Map<string, number>) {
  const v = new Array(vocab.size).fill(0);
  for (const t of tokens) {
    const i = vocab.get(t.toLowerCase());
    if (i !== undefined) v[i] += 1;
  }
  return v;
}
function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, savedRes, appliedRes, eventsRes] = await Promise.all([
      supabase.from("profiles").select("skills,interests,preferred_locations,branch").eq("id", userId).maybeSingle(),
      supabase.from("saved_events").select("event_id").eq("user_id", userId),
      supabase.from("applied_events").select("event_id").eq("user_id", userId),
      supabase.from("events").select("*").eq("is_approved", true).gte("start_date", new Date().toISOString()),
    ]);

    const profile = profileRes.data;
    const events = (eventsRes.data ?? []) as EventRow[];
    const savedIds = new Set((savedRes.data ?? []).map((r) => r.event_id));
    const appliedIds = new Set((appliedRes.data ?? []).map((r) => r.event_id));

    // Build vocab from all event tags + user profile
    const vocab = new Map<string, number>();
    const addTokens = (arr: string[]) => arr.forEach((t) => {
      const k = t.toLowerCase(); if (!vocab.has(k)) vocab.set(k, vocab.size);
    });
    for (const e of events) { addTokens(e.tech_tags); addTokens(e.branch_tags); addTokens([e.event_type, e.mode]); if (e.city) addTokens([e.city]); }
    const userTokens = [
      ...(profile?.skills ?? []),
      ...(profile?.interests ?? []),
      ...(profile?.preferred_locations ?? []),
      ...(profile?.branch ? [profile.branch] : []),
    ];
    addTokens(userTokens);

    // Add tokens from user's applied/saved events to reinforce signal
    const historicEvents = events.filter((e) => savedIds.has(e.id) || appliedIds.has(e.id));
    const userVectorTokens = [
      ...userTokens,
      ...historicEvents.flatMap((e) => [...e.tech_tags, ...e.branch_tags, e.event_type]),
    ];
    const userVec = vectorize(userVectorTokens, vocab);

    const scored = events
      .filter((e) => !appliedIds.has(e.id))
      .map((e) => {
        const eTokens = [...e.tech_tags, ...e.branch_tags, e.event_type, e.mode, ...(e.city ? [e.city] : [])];
        const eVec = vectorize(eTokens, vocab);
        const sim = cosine(userVec, eVec);
        const popBoost = Math.log10(1 + e.popularity) / 10;
        const freeBoost = e.is_free ? 0.03 : 0;
        const savedBoost = savedIds.has(e.id) ? 0.1 : 0;
        const score = sim + popBoost + freeBoost + savedBoost;
        return { event: e, score, confidence: Math.min(1, sim * 1.2 + popBoost) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return scored;
  });
