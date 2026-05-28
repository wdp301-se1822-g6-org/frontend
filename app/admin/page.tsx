'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  CalendarCheck, Users, CreditCard, Star,
  TrendingUp, TrendingDown, ArrowRight,
  Clock, Car, Layers, Crown,
} from 'lucide-react';
import Link from 'next/link';

// ─── Stat Card ─────────────────────────────────────────
function StatCard({
  label, value, sub, trend, trendUp, icon: Icon, iconBg,
}: {
  label: string; value: string; sub: string;
  trend?: string; trendUp?: boolean;
  icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'>
      <div className='flex items-start justify-between mb-4'>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className='w-5 h-5 text-white' />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trendUp ? <TrendingUp className='w-3 h-3' /> : <TrendingDown className='w-3 h-3' />}
            {trend}
          </span>
        )}
      </div>
      <p className='text-2xl font-black text-foreground tracking-tight mb-1'>{value}</p>
      <p className='text-xs font-black text-foreground uppercase tracking-widest mb-1'>{label}</p>
      <p className='text-foreground/40 text-xs font-medium'>{sub}</p>
    </div>
  );
}

// ─── Recent bookings mock ───────────────────────────────
const recentBookings = [
  { id: 'BK001', customer: 'Nguyễn Văn A', plate: 'ABC-1234', service: 'Rửa cao cấp', time: '09:30', amount: '350.000đ', status: 'completed' },
  { id: 'BK002', customer: 'Trần Thị B', plate: 'XYZ-5678', service: 'Rửa tiêu chuẩn', time: '10:15', amount: '150.000đ', status: 'in_progress' },
  { id: 'BK003', customer: 'Lê Văn C', plate: 'DEF-9012', service: 'Vệ sinh nội thất', time: '10:45', amount: '250.000đ', status: 'confirmed' },
  { id: 'BK004', customer: 'Phạm Thị D', plate: 'GHI-3456', service: 'Rửa nhanh', time: '11:00', amount: '80.000đ', status: 'pending' },
  { id: 'BK005', customer: 'Hoàng Văn E', plate: 'JKL-7890', service: 'Rửa tiêu chuẩn', time: '11:30', amount: '150.000đ', status: 'confirmed' },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed:   { label: 'Hoàn thành',    cls: 'bg-emerald-50 text-emerald-700' },
  in_progress: { label: 'Đang xử lý',   cls: 'bg-blue-50 text-blue-700' },
  confirmed:   { label: 'Xác nhận',      cls: 'bg-primary/10 text-primary' },
  pending:     { label: 'Chờ xử lý',     cls: 'bg-yellow-50 text-yellow-700' },
  cancelled:   { label: 'Đã huỷ',        cls: 'bg-rose-50 text-rose-700' },
};

// ─── Quick actions ──────────────────────────────────────
const quickActions = [
  { label: 'Tạo đặt lịch', sub: 'Thêm booking mới', href: '/admin/bookings', icon: CalendarCheck, bg: 'bg-primary' },
  { label: 'Thêm người dùng', sub: 'Tạo tài khoản mới', href: '/admin/users', icon: Users, bg: 'bg-secondary' },
  { label: 'Quản lý dịch vụ', sub: 'Sửa gói dịch vụ', href: '/admin/services', icon: Layers, bg: 'bg-emerald-500' },
  { label: 'Xem báo cáo', sub: 'Phân tích & thống kê', href: '/admin/orders', icon: CreditCard, bg: 'bg-purple-500' },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar
        title='Tổng quan Dashboard'
        subtitle='Xin chào, Admin! Đây là những gì đang diễn ra hôm nay.'
      />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-7xl mx-auto flex flex-col gap-8'>

          {/* Stat Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5'>
            <StatCard label='Đặt lịch hôm nay' value='128' sub='So với hôm qua' trend='+18%' trendUp icon={CalendarCheck} iconBg='bg-primary' />
            <StatCard label='Khách hàng' value='1.245' sub='Tổng người dùng' trend='+15%' trendUp icon={Users} iconBg='bg-secondary' />
            <StatCard label='Doanh thu hôm nay' value='4.320.000đ' sub='So với hôm qua' trend='+22%' trendUp icon={CreditCard} iconBg='bg-emerald-500' />
            <StatCard label='Đánh giá trung bình' value='4.8 ⭐' sub='Dựa trên 152 đánh giá' icon={Star} iconBg='bg-yellow-500' />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className='font-heading text-sm font-black uppercase tracking-widest text-foreground/40 mb-4'>Thao tác nhanh</h2>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {quickActions.map(({ label, sub, href, icon: Icon, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${bg} rounded-2xl p-5 text-white flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 shadow-lg group`}
                >
                  <div className='w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Icon className='w-5 h-5' />
                  </div>
                  <div>
                    <p className='font-black text-sm'>{label}</p>
                    <p className='text-white/60 text-xs mt-0.5'>{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Two columns: recent bookings + stats */}
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>

            {/* Recent Bookings Table */}
            <div className='xl:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden'>
              <div className='flex items-center justify-between px-6 py-5 border-b border-border/50'>
                <h2 className='font-heading font-black text-foreground text-base'>Đặt lịch gần đây</h2>
                <Link href='/admin/bookings' className='text-xs font-black text-primary hover:underline flex items-center gap-1'>
                  Xem tất cả <ArrowRight className='w-3 h-3' />
                </Link>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/50'>
                      <th className='text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Khách hàng</th>
                      <th className='text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Biển số</th>
                      <th className='text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Dịch vụ</th>
                      <th className='text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Giờ</th>
                      <th className='text-right px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Số tiền</th>
                      <th className='text-center px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40'>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/30'>
                    {recentBookings.map((b) => {
                      const s = statusConfig[b.status];
                      return (
                        <tr key={b.id} className='hover:bg-muted/20 transition-colors'>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs'>
                                {b.customer[0]}
                              </div>
                              <span className='font-semibold text-foreground text-sm'>{b.customer}</span>
                            </div>
                          </td>
                          <td className='px-4 py-4 text-foreground/60 font-mono text-xs'>{b.plate}</td>
                          <td className='px-4 py-4 text-foreground/70 text-sm'>{b.service}</td>
                          <td className='px-4 py-4 text-foreground/60 text-sm'>{b.time}</td>
                          <td className='px-4 py-4 text-right font-black text-foreground text-sm'>{b.amount}</td>
                          <td className='px-4 py-4 text-center'>
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column stats */}
            <div className='flex flex-col gap-5'>
              {/* Loyalty summary */}
              <div className='bg-white rounded-2xl border border-border/50 shadow-sm p-6'>
                <h2 className='font-heading font-black text-foreground text-base mb-5'>Thống kê thành viên</h2>
                <div className='flex flex-col gap-4'>
                  {[
                    { label: 'Tổng khách hàng', value: '1.245', icon: Users, color: 'text-primary bg-primary/10' },
                    { label: 'Thành viên Loyalty', value: '672', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
                    { label: 'Tỷ lệ quay lại', value: '54%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                          <Icon className='w-4 h-4' />
                        </div>
                        <span className='text-sm font-semibold text-foreground/70'>{label}</span>
                      </div>
                      <span className='font-black text-foreground'>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service breakdown */}
              <div className='bg-white rounded-2xl border border-border/50 shadow-sm p-6'>
                <h2 className='font-heading font-black text-foreground text-base mb-5'>Dịch vụ phổ biến</h2>
                {[
                  { name: 'Rửa cao cấp', pct: 42, color: 'bg-primary' },
                  { name: 'Rửa tiêu chuẩn', pct: 28, color: 'bg-secondary' },
                  { name: 'Vệ sinh nội thất', pct: 18, color: 'bg-emerald-500' },
                  { name: 'Rửa nhanh', pct: 12, color: 'bg-yellow-500' },
                ].map(({ name, pct, color }) => (
                  <div key={name} className='mb-4 last:mb-0'>
                    <div className='flex justify-between mb-1.5'>
                      <span className='text-sm font-semibold text-foreground/70'>{name}</span>
                      <span className='text-sm font-black text-foreground'>{pct}%</span>
                    </div>
                    <div className='h-2 bg-muted rounded-full overflow-hidden'>
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Nav shortcuts */}
              <div className='bg-foreground rounded-2xl p-5 text-white'>
                <p className='font-black text-sm mb-4 text-white/70 uppercase tracking-widest'>Quản lý nhanh</p>
                <div className='grid grid-cols-2 gap-2'>
                  {[
                    { href: '/admin/vehicles', icon: Car, label: 'Xe' },
                    { href: '/admin/shifts', icon: Clock, label: 'Ca làm' },
                    { href: '/admin/services', icon: Layers, label: 'Dịch vụ' },
                    { href: '/admin/tiers', icon: Crown, label: 'Hạng' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className='flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-colors'
                    >
                      <Icon className='w-4 h-4 text-primary' />
                      <span className='text-sm font-semibold text-white/70'>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
