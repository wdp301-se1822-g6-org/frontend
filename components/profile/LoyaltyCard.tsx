'use client';

import { Crown, Calendar, Coins } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoyaltyAccount } from '@/types/loyalty';
import { formatDate } from '@/lib/format';

export const tierStyles: Record<
  string,
  {
    gradient: string;
    text: string;
    border: string;
    glow: string;
    badgeBg: string;
    chipBg: string;
  }
> = {
  member: {
    gradient: 'from-zinc-700 via-zinc-800 to-zinc-950',
    text: 'text-zinc-300',
    border: 'border-zinc-600/30',
    glow: 'shadow-zinc-950/20',
    badgeBg: 'bg-zinc-800/80 text-zinc-300 border-zinc-600',
    chipBg: 'bg-zinc-600/20',
  },
  silver: {
    gradient: 'from-slate-400 via-slate-600 to-slate-800',
    text: 'text-slate-100',
    border: 'border-slate-500/30',
    glow: 'shadow-slate-600/20',
    badgeBg: 'bg-slate-700/80 text-slate-200 border-slate-500',
    chipBg: 'bg-slate-500/20',
  },
  gold: {
    gradient: 'from-amber-400 via-yellow-600 to-amber-900',
    text: 'text-amber-100',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-600/30',
    badgeBg: 'bg-amber-900/60 text-amber-200 border-amber-500',
    chipBg: 'bg-amber-500/20',
  },
  platinum: {
    gradient: 'from-cyan-500 via-blue-700 to-slate-900',
    text: 'text-cyan-100',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-600/30',
    badgeBg: 'bg-cyan-950/80 text-cyan-200 border-cyan-500',
    chipBg: 'bg-cyan-500/20',
  },
};

const fallbackExpiryDate = new Date();
fallbackExpiryDate.setFullYear(fallbackExpiryDate.getFullYear() + 1);

export default function LoyaltyCard({
  loyalty,
}: {
  loyalty: LoyaltyAccount | null;
}) {
  const authUser = useAuthStore((s) => s.authUser);
  const currentTierName = (loyalty?.tierName ?? 'Member').toLowerCase();
  const currentStyle = tierStyles[currentTierName] || tierStyles.member;

  return (
    <div
      className={`relative rounded-3xl p-8 bg-gradient-to-br ${currentStyle.gradient} text-white shadow-xl ${currentStyle.glow} overflow-hidden border ${currentStyle.border} aspect-[1.586/1] flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01]`}
    >
      {/* Background elements */}
      <div className='absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500' />
      <div className='absolute left-1/3 bottom-0 w-48 h-24 bg-white/5 rounded-full blur-xl' />

      {/* Card Header */}
      <div className='flex justify-between items-start z-10'>
        <div className='space-y-1'>
          <p className='text-[10px] font-black uppercase tracking-widest text-white/60'>
            E-Membership Card
          </p>
          <h3 className='font-heading font-black tracking-wider text-lg'>
            WASH AUTO
          </h3>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border flex items-center gap-1.5 backdrop-blur-md ${currentStyle.badgeBg}`}
        >
          <Crown className='w-3.5 h-3.5' /> {loyalty?.tierName || 'Member'}
        </div>
      </div>

      {/* Card Body with EMV Chip Design */}
      <div className='flex items-center gap-4 z-10 my-4'>
        <div
          className={`w-11 h-9 rounded-md ${currentStyle.chipBg} border border-white/20 relative overflow-hidden flex flex-col justify-around p-1`}
        >
          <div className='h-[1px] bg-white/20 w-full' />
          <div className='h-[1px] bg-white/20 w-full' />
          <div className='h-[1px] bg-white/20 w-full' />
        </div>
        <div>
          <p className='text-xs font-medium text-white/70'>Tên chủ thẻ</p>
          <p className='font-bold uppercase tracking-wider text-sm sm:text-base'>
            {authUser?.name || 'KHÁCH HÀNG'}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className='grid grid-cols-2 gap-4 border-t border-white/15 pt-4 z-10'>
        <div>
          <p className='text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1'>
            <Coins className='w-3 h-3' /> Điểm Tích Lũy
          </p>
          <p className='text-lg font-black tracking-wide'>
            {(loyalty?.pointsBalance ?? 0).toLocaleString()}{' '}
            <span className='text-xs font-semibold text-white/70'>PTS</span>
          </p>
        </div>
        <div className='text-right'>
          <p className='text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1 justify-end'>
            <Calendar className='w-3 h-3' /> Hạn Dùng Điểm
          </p>
          <p className='text-sm font-bold'>
            {formatDate(loyalty?.lastAnnualResetAt ?? fallbackExpiryDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
