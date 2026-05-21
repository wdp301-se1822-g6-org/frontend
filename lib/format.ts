/** Hàm format dùng chung toàn app — locale Việt Nam. */

/** Định dạng tiền tệ VND, ví dụ 150000 -> "150.000 ₫". */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Định dạng số có dấu phân cách hàng nghìn, ví dụ 15000 -> "15.000". */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('vi-VN').format(value);
}

/** Định dạng ngày dd/MM/yyyy. Nhận Date hoặc chuỗi ISO từ API. */
export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(
    'vi-VN',
    options ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
  ).format(date);
}

/** Định dạng ngày kèm giờ, ví dụ "20/05/2026 14:30". */
export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lấy chữ viết tắt từ tên (tối đa 2 chữ cái cuối).
 * Gom logic đang lặp ở `Navbar.tsx`, `ProfileSidebar.tsx`, `app/profile/page.tsx`.
 */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  return initials || '?';
}
