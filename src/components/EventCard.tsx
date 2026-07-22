import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Trophy, Users } from "lucide-react";
import { format } from "date-fns";

export type EventCardData = {
  id: string; slug: string; title: string; short_description: string | null;
  organizer: string; city: string | null; state: string | null; mode: string;
  event_type: string; image_url: string | null; start_date: string;
  is_free: boolean; price: number | null; prize_pool: number | null;
  difficulty: string | null; popularity: number;
};

export function EventCard({ event, score }: { event: EventCardData; score?: number }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:shadow-glow hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {event.image_url && (
          <img src={event.image_url} alt={event.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-background/90 text-foreground backdrop-blur border-0">{event.event_type}</Badge>
          {event.is_free ? <Badge className="bg-emerald-500/90 text-white border-0">Free</Badge> : <Badge className="bg-background/90 text-foreground backdrop-blur border-0">₹{event.price}</Badge>}
        </div>
        {score !== undefined && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-brand text-white border-0">AI {(score * 100).toFixed(0)}%</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div>
          <h3 className="font-display font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.short_description}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(event.start_date), "MMM d")}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.mode === "Online" ? "Online" : event.city ?? event.mode}</span>
          {event.prize_pool && event.prize_pool > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><Trophy className="h-3.5 w-3.5" />₹{(event.prize_pool / 100000).toFixed(0)}L</span>
          ) : null}
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.popularity}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground truncate">by {event.organizer}</span>
          {event.difficulty && <Badge variant="outline" className="text-xs">{event.difficulty}</Badge>}
        </div>
      </div>
    </Link>
  );
}
