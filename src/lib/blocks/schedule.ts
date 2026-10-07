/**
 * Scheduling helpers. The database (RLS) is the source of truth for what the
 * public sees; these helpers only mirror that rule for dashboard badges.
 * @see supabase/migrations/20261007120000_dynamic_blocks.sql — "Public sees published sections"
 */
export type ScheduleStatus = "hidden" | "scheduled" | "live" | "expired";

interface Schedulable {
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export function scheduleStatus(item: Schedulable, now: Date = new Date()): ScheduleStatus {
  if (!item.active) return "hidden";
  if (item.starts_at && new Date(item.starts_at) > now) return "scheduled";
  if (item.ends_at && new Date(item.ends_at) <= now) return "expired";
  return "live";
}

/** Upcoming Sunday 23:59:59 local time — powers the "só esta semana" shortcut. */
export function endOfWeek(now: Date = new Date()): Date {
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  end.setHours(23, 59, 59, 0);
  return end;
}

/** `<input type="datetime-local">` value ⇄ ISO string conversions (local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Remaining time label for panel countdowns, e.g. "2d 4h" / "3h 12min". */
export function remainingLabel(endsAt: string, now: Date = new Date()): string | null {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  return `${Math.max(minutes, 1)}min`;
}
