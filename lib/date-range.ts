/**
 * Shared date-range logic for the Management Reporting dashboard.
 *
 * All presets are computed against the *Vietnam* calendar day (UTC+7), not the
 * browser timezone, so "Hôm nay" means the same day for every user. Dates are
 * exchanged with the API as plain `YYYY-MM-DD` strings; the backend resolves
 * them to VN day boundaries. Keep all range math here - never duplicate it in
 * components.
 */

export type DashboardPeriod =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'last7'
  | 'last30'
  | 'month'
  | 'lastMonth'
  | 'quarter'
  | 'lastQuarter'
  | 'year'
  | 'lastYear'
  | 'custom';

/** Inclusive range, both ends as `YYYY-MM-DD`. */
export interface DateRange {
  from: string;
  to: string;
}

export const DEFAULT_PERIOD: DashboardPeriod = 'month';

const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Today's VN calendar date, anchored at UTC midnight for stable arithmetic. */
function vnToday(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = parts.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

function range(from: Date, to: Date): DateRange {
  return { from: toIso(from), to: toIso(to) };
}

/* ─── Preset builders ─────────────────────────────────────────────────── */

export function getTodayRange(): DateRange {
  const t = vnToday();
  return range(t, t);
}

export function getYesterdayRange(): DateRange {
  const y = addDays(vnToday(), -1);
  return range(y, y);
}

/** Monday → Sunday of the current VN week. */
export function getThisWeekRange(): DateRange {
  const t = vnToday();
  const offset = (t.getUTCDay() + 6) % 7; // Monday = 0
  const monday = addDays(t, -offset);
  return range(monday, addDays(monday, 6));
}

export function getLast7Range(): DateRange {
  const t = vnToday();
  return range(addDays(t, -6), t);
}

export function getLast30Range(): DateRange {
  const t = vnToday();
  return range(addDays(t, -29), t);
}

export function getThisMonthRange(): DateRange {
  const t = vnToday();
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  return range(new Date(Date.UTC(y, m, 1)), new Date(Date.UTC(y, m + 1, 0)));
}

export function getLastMonthRange(): DateRange {
  const t = vnToday();
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  return range(new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 0)));
}

export function getThisQuarterRange(): DateRange {
  const t = vnToday();
  const y = t.getUTCFullYear();
  const startMonth = Math.floor(t.getUTCMonth() / 3) * 3;
  return range(
    new Date(Date.UTC(y, startMonth, 1)),
    new Date(Date.UTC(y, startMonth + 3, 0)),
  );
}

export function getLastQuarterRange(): DateRange {
  const t = vnToday();
  const q = Math.floor(t.getUTCMonth() / 3);
  const y = q === 0 ? t.getUTCFullYear() - 1 : t.getUTCFullYear();
  const startMonth = q === 0 ? 9 : (q - 1) * 3;
  return range(
    new Date(Date.UTC(y, startMonth, 1)),
    new Date(Date.UTC(y, startMonth + 3, 0)),
  );
}

export function getThisYearRange(): DateRange {
  const y = vnToday().getUTCFullYear();
  return range(new Date(Date.UTC(y, 0, 1)), new Date(Date.UTC(y, 11, 31)));
}

export function getLastYearRange(): DateRange {
  const y = vnToday().getUTCFullYear() - 1;
  return range(new Date(Date.UTC(y, 0, 1)), new Date(Date.UTC(y, 11, 31)));
}

export function getCustomRange(from: string, to: string): DateRange {
  return { from, to };
}

const BUILDERS: Record<Exclude<DashboardPeriod, 'custom'>, () => DateRange> = {
  today: getTodayRange,
  yesterday: getYesterdayRange,
  week: getThisWeekRange,
  last7: getLast7Range,
  last30: getLast30Range,
  month: getThisMonthRange,
  lastMonth: getLastMonthRange,
  quarter: getThisQuarterRange,
  lastQuarter: getLastQuarterRange,
  year: getThisYearRange,
  lastYear: getLastYearRange,
};

/** Resolve a preset to its concrete range. `custom` returns the default month. */
export function getRangeForPeriod(period: DashboardPeriod): DateRange {
  if (period === 'custom') return getThisMonthRange();
  return BUILDERS[period]();
}

/* ─── Validation & labels ─────────────────────────────────────────────── */

/** `null` = valid; otherwise a human-readable reason the range is unusable. */
export function validateCustomRange(
  from: string,
  to: string,
): string | null {
  if (!from || !to) {
    return 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.';
  }
  if (from > to) {
    return 'Ngày bắt đầu không được lớn hơn ngày kết thúc.';
  }
  return null;
}

/** `2026-06-01` → `01/06/2026`. */
export function formatIsoDmy(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Concise label of the window currently being viewed. */
export function formatRangeLabel(
  period: DashboardPeriod,
  r: DateRange,
): string {
  if (period === 'today' || period === 'yesterday') {
    return formatIsoDmy(r.from);
  }
  if (period === 'quarter' || period === 'lastQuarter') {
    const [y, m] = r.from.split('-').map(Number);
    return `Q${Math.floor((m - 1) / 3) + 1}/${y}`;
  }
  if (period === 'year' || period === 'lastYear') {
    return r.from.slice(0, 4);
  }
  if (r.from === r.to) return formatIsoDmy(r.from);
  return `${formatIsoDmy(r.from)} - ${formatIsoDmy(r.to)}`;
}
