
export const TIERS = {
  MEMBER: 'member',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export type Tier = (typeof TIERS)[keyof typeof TIERS];

export const TIER_META: Record<
  Tier,
  { label: string; badgeClass: string; gradientClass: string }
> = {
  member: {
    label: 'Member',
    badgeClass: 'bg-primary/10 text-primary',
    gradientClass: 'from-primary/20 via-primary/10 to-primary/30',
  },
  silver: {
    label: 'Silver',
    badgeClass: 'bg-slate-100 text-slate-600',
    gradientClass: 'from-slate-300 via-slate-100 to-slate-400',
  },
  gold: {
    label: 'Gold',
    badgeClass: 'bg-amber-100 text-amber-600',
    gradientClass: 'from-amber-400 via-yellow-200 to-amber-500',
  },
  platinum: {
    label: 'Platinum',
    badgeClass: 'bg-secondary/10 text-secondary',
    gradientClass: 'from-secondary via-primary to-secondary',
  },
};

/** Lấy meta hạng an toàn, fallback về Member. */
export function getTierMeta(tier?: string | null) {
  const key = tier?.toLowerCase();
  if (key && key in TIER_META) return TIER_META[key as Tier];
  return TIER_META.member;
}
