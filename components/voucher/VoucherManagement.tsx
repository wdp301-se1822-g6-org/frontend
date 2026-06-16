'use client';

import {
  adminGetVouchers,
  adminGrantVoucher,
  adminRevokeVoucher,
  adminGetUsers,
  adminGetOrders,
  type GrantVoucherPayload,
} from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { formatCurrency } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Ticket,
  Plus,
  Search,
  X,
  Ban,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Voucher } from '@/types/voucher';

type VoucherMode = 'admin' | 'manager';

interface VoucherListResult {
  data: Voucher[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

interface CustomerLite {
  id: string;
  name: string;
  email: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  unused: {
    label: 'Chưa dùng',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  used: {
    label: 'Đã dùng',
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  expired: {
    label: 'Hết hạn',
    cls: 'bg-rose-50 text-rose-700 border border-rose-100',
  },
};

const statusTabs: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unused', label: 'Chưa dùng' },
  { value: 'used', label: 'Đã dùng' },
  { value: 'expired', label: 'Hết hạn' },
];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '-';

// ─────────────────────────── Grant modal ───────────────────────────
function GrantModal({
  mode,
  customers,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: VoucherMode;
  customers: CustomerLite[];
  onClose: () => void;
  onSubmit: (payload: GrantVoucherPayload) => void;
  submitting: boolean;
}) {
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [discountCapVnd, setDiscountCapVnd] = useState(100000);
  const [expiresAt, setExpiresAt] = useState('');

  const codeValid =
    code.trim() === '' || /^[A-Za-z0-9-]{3,30}$/.test(code.trim());

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers.slice(0, 8);
    const q = search.toLowerCase();
    return customers
      .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [customers, search]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const capValid = discountCapVnd >= 1 && discountCapVnd <= 200000;
  const canSubmit = customerId.trim().length > 0 && capValid && codeValid;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      customerId: customerId.trim(),
      // BE vẫn yêu cầu trường reason - gửi mặc định khi cấp thủ công.
      reason: 'Cấp voucher thủ công',
      discountCapVnd,
      ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      ...(code.trim() ? { code: code.trim().toUpperCase() } : {}),
    });
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between mb-6'>
          <h3 className='font-heading font-black text-foreground text-lg flex items-center gap-2'>
            <Ticket className='w-5 h-5 text-primary' /> Cấp voucher rửa miễn phí
          </h3>
          <button
            onClick={onClose}
            aria-label='Đóng'
          >
            <X className='w-5 h-5 text-foreground/40' />
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          {/* Customer */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>
              Khách hàng
            </label>
            {selectedCustomer ? (
              <div className='flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5'>
                <div className='min-w-0'>
                  <p className='text-sm font-bold text-foreground truncate'>
                    {selectedCustomer.name}
                  </p>
                  <p className='text-[11px] text-muted-foreground truncate'>
                    {selectedCustomer.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCustomerId('');
                    setSearch('');
                  }}
                  className='text-xs font-bold text-primary shrink-0 cursor-pointer'
                >
                  Đổi
                </button>
              </div>
            ) : (
              <>
                <div className='relative'>
                  <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30' />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Tìm theo tên hoặc email…'
                    className='w-full border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50'
                  />
                </div>
                {filteredCustomers.length > 0 && (
                  <div className='mt-2 border border-border rounded-xl divide-y divide-border max-h-52 overflow-y-auto'>
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCustomerId(c.id)}
                        className='w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer'
                      >
                        <p className='text-sm font-semibold text-foreground truncate'>
                          {c.name}
                        </p>
                        <p className='text-[11px] text-muted-foreground truncate'>
                          {c.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {customers.length === 0 && (
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Chưa có khách hàng để chọn
                    {mode === 'manager'
                      ? ' (danh sách lấy từ các đơn đặt lịch).'
                      : '.'}
                  </p>
                )}
                {search.trim() &&
                  customers.length > 0 &&
                  filteredCustomers.length === 0 && (
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Không tìm thấy khách hàng phù hợp.
                    </p>
                  )}
              </>
            )}
          </div>

          {/* Custom code */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-foreground/60 mb-1.5'>
              Mã voucher{' '}
              <span className='font-semibold normal-case text-foreground/40'>
                (bỏ trống = tự sinh)
              </span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder='VD: FREEWASH-KHOI'
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-primary/50'
            />
            {!codeValid && (
              <p className='mt-1.5 text-[11px] text-rose-600'>
                Mã chỉ gồm 3-30 ký tự A-Z, 0-9 hoặc dấu gạch ngang.
              </p>
            )}
            <p className='mt-1.5 text-[11px] text-muted-foreground'>
              Mã để đọc cho khách nhập khi đặt lịch. Phải là duy nhất.
            </p>
          </div>

          {/* Discount cap */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-foreground/60 mb-1.5'>
              Giảm tối đa (VND)
            </label>
            <input
              type='number'
              min={1}
              max={200000}
              step={1000}
              value={discountCapVnd}
              onChange={(e) => setDiscountCapVnd(Number(e.target.value))}
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50'
            />
            {!capValid && (
              <p className='mt-1.5 text-[11px] text-rose-600'>
                Mức giảm phải từ 1 đến 200.000đ.
              </p>
            )}
          </div>

          {/* Expiry */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>
              Ngày hết hạn{' '}
              <span className='font-semibold normal-case text-foreground/30'>
                (bỏ trống = 90 ngày)
              </span>
            </label>
            <input
              type='date'
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50'
            />
          </div>
        </div>

        <div className='flex gap-3 mt-6'>
          <button
            onClick={onClose}
            className='flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted'
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className='flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {submitting ? 'Đang cấp…' : 'Cấp voucher'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Revoke modal ───────────────────────────
function RevokeModal({
  voucher,
  onClose,
  onSubmit,
  submitting,
}: {
  voucher: Voucher;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length >= 5;

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-heading font-black text-foreground text-lg flex items-center gap-2'>
            <Ban className='w-5 h-5 text-rose-500' /> Thu hồi voucher
          </h3>
          <button
            onClick={onClose}
            aria-label='Đóng'
          >
            <X className='w-5 h-5 text-foreground/40' />
          </button>
        </div>
        <p className='text-sm text-muted-foreground mb-5'>
          Voucher{' '}
          <span className='font-bold text-foreground'>{voucher.code}</span> sẽ
          bị chuyển sang trạng thái hết hạn và không dùng được nữa.
        </p>

        <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>
          Lý do thu hồi <span className='text-rose-500'>*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder='VD: Cấp nhầm khách hàng'
          className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 resize-none'
        />
        <p className='mt-1.5 text-[11px] text-muted-foreground'>
          Tối thiểu 5 ký tự.
        </p>

        <div className='flex gap-3 mt-6'>
          <button
            onClick={onClose}
            className='flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted'
          >
            Huỷ
          </button>
          <button
            onClick={() => canSubmit && onSubmit(reason.trim())}
            disabled={!canSubmit || submitting}
            className='flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-black hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {submitting ? 'Đang thu hồi…' : 'Thu hồi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Main ───────────────────────────
export function VoucherManagement({ mode }: { mode: VoucherMode }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showGrant, setShowGrant] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Voucher | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-vouchers', mode, statusFilter, page],
    queryFn: async (): Promise<VoucherListResult> => {
      const res = await adminGetVouchers({
        page,
        limit: 20,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      });
      return res.data as VoucherListResult;
    },
  });

  // Danh sách khách cho bộ chọn + map tên.
  // - Admin: lấy từ /admin/users (đầy đủ khách hàng).
  // - Manager: KHÔNG được phép gọi /admin/users, nên suy ra khách từ các đơn
  //   đặt lịch (/admin/orders manager xem được, đã kèm customerId + tên + email).
  const { data: customersData } = useQuery({
    queryKey: ['voucher-customers', mode],
    queryFn: async (): Promise<CustomerLite[]> => {
      if (mode === 'admin') {
        const res = await adminGetUsers({ role: 'customer', limit: 100 });
        const rows =
          (res.data?.data?.data as Record<string, unknown>[]) ??
          (res.data?.data as Record<string, unknown>[]) ??
          [];
        return rows.map((u) => ({
          id: String(u._id ?? u.id ?? ''),
          name: String(u.fullName ?? u.name ?? 'Khách hàng'),
          email: String(u.email ?? ''),
        }));
      }
      // manager → dedupe khách từ danh sách đơn
      const res = await adminGetOrders({ limit: 100 });
      const rows =
        (res.data?.data as Record<string, unknown>[]) ??
        (res.data as Record<string, unknown>[]) ??
        [];
      const map = new Map<string, CustomerLite>();
      for (const o of rows) {
        const id = String(o.customerId ?? '');
        if (!id || map.has(id)) continue;
        map.set(id, {
          id,
          name: String(o.customerName ?? 'Khách hàng'),
          email: String(o.customerEmail ?? ''),
        });
      }
      return [...map.values()];
    },
  });
  const customers = customersData ?? [];
  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? id;

  const vouchers = data?.data ?? [];
  const meta = data?.meta;

  const grant = useMutation({
    mutationFn: (payload: GrantVoucherPayload) => adminGrantVoucher(payload),
    onSuccess: () => {
      toast.success('Đã cấp voucher cho khách hàng');
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] });
      setShowGrant(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminRevokeVoucher(id, reason),
    onSuccess: () => {
      toast.success('Đã thu hồi voucher');
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] });
      setRevokeTarget(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <main className='flex-1 p-8 overflow-y-auto'>
      <div className='max-w-6xl mx-auto'>
        {/* Toolbar */}
        <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
          <div className='flex items-center gap-1.5 bg-white border border-border rounded-xl p-1'>
            {statusTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setStatusFilter(t.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  statusFilter === t.value
                    ? 'bg-primary text-white'
                    : 'text-foreground/60 hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => refetch()}
              className='p-2.5 rounded-xl border border-border bg-white hover:bg-muted text-foreground/60'
              title='Tải lại'
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => setShowGrant(true)}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90'
            >
              <Plus className='w-4 h-4' /> Cấp voucher
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='bg-white border border-border rounded-2xl overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-slate-50 text-left text-xs font-black uppercase tracking-wider text-foreground/40'>
                  <th className='px-5 py-3.5'>Mã voucher</th>
                  <th className='px-5 py-3.5'>Khách hàng</th>
                  <th className='px-5 py-3.5'>Giảm tối đa</th>
                  <th className='px-5 py-3.5'>Trạng thái</th>
                  <th className='px-5 py-3.5'>Hết hạn</th>
                  <th className='px-5 py-3.5 text-right'>Thao tác</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={6}
                        className='px-5 py-4'
                      >
                        <div className='h-5 bg-slate-100 rounded animate-pulse' />
                      </td>
                    </tr>
                  ))
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-5 py-16 text-center text-muted-foreground'
                    >
                      <Ticket className='w-8 h-8 mx-auto mb-2 text-foreground/20' />
                      Chưa có voucher nào.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v) => {
                    const sc = statusConfig[v.status] ?? {
                      label: v.status,
                      cls: 'bg-slate-100 text-slate-600',
                    };
                    return (
                      <tr
                        key={v.id}
                        className='hover:bg-slate-50/60'
                      >
                        <td className='px-5 py-3.5 font-mono font-bold text-foreground'>
                          {v.code}
                        </td>
                        <td className='px-5 py-3.5 text-foreground/80'>
                          {(() => {
                            // Ưu tiên tên kèm theo từ BE; nếu không có thì map
                            // từ danh sách khách đã tải (admin: từ users,
                            // manager: từ các đơn đặt lịch).
                            const name =
                              v.customerName ?? customerName(v.customerId);
                            return name && name !== v.customerId ? (
                              <span title={v.customerId}>
                                <span className='font-semibold text-foreground'>
                                  {name}
                                </span>
                                {v.customerEmail && (
                                  <span className='block text-[11px] text-muted-foreground'>
                                    {v.customerEmail}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className='font-mono text-xs text-foreground/60'>
                                {v.customerId}
                              </span>
                            );
                          })()}
                        </td>
                        <td className='px-5 py-3.5 font-semibold text-foreground'>
                          {formatCurrency(v.discountCapVnd)}
                        </td>
                        <td className='px-5 py-3.5'>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${sc.cls}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className='px-5 py-3.5 text-foreground/70'>
                          {fmtDate(v.expiresAt)}
                        </td>
                        <td className='px-5 py-3.5 text-right'>
                          {v.status === 'unused' ? (
                            <button
                              onClick={() => setRevokeTarget(v)}
                              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50'
                            >
                              <Ban className='w-3.5 h-3.5' /> Thu hồi
                            </button>
                          ) : (
                            <span className='text-xs text-foreground/30'>
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className='flex items-center justify-between mt-4 text-sm text-muted-foreground'>
            <span>
              Trang {meta.page}/{meta.totalPages} · {meta.total} voucher
            </span>
            <div className='flex gap-2'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='px-3 py-1.5 rounded-lg border border-border bg-white font-semibold disabled:opacity-40'
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className='px-3 py-1.5 rounded-lg border border-border bg-white font-semibold disabled:opacity-40'
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {mode === 'manager' && (
          <p className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
            <AlertCircle className='w-3.5 h-3.5 shrink-0' />
            Danh sách khách để cấp voucher được lấy từ những khách đã có đơn đặt
            lịch.
          </p>
        )}
      </div>

      {showGrant && (
        <GrantModal
          mode={mode}
          customers={customers}
          submitting={grant.isPending}
          onClose={() => setShowGrant(false)}
          onSubmit={(payload) => grant.mutate(payload)}
        />
      )}
      {revokeTarget && (
        <RevokeModal
          voucher={revokeTarget}
          submitting={revoke.isPending}
          onClose={() => setRevokeTarget(null)}
          onSubmit={(reason) => revoke.mutate({ id: revokeTarget.id, reason })}
        />
      )}
    </main>
  );
}
