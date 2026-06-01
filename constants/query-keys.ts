/**
 * Query key tập trung cho TanStack Query - đảm bảo cache key nhất quán,
 * tránh mỗi hook tự đặt key một kiểu.
 */
export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  orders: {
    all: ['orders'] as const,
    mine: ['orders', 'mine'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    adminList: (params?: Record<string, unknown>) =>
      ['orders', 'admin', params ?? {}] as const,
  },
  serviceTypes: {
    all: ['service-types'] as const,
  },
  vehicles: {
    mine: ['vehicles', 'mine'] as const,
  },
  loyalty: {
    mine: ['loyalty', 'mine'] as const,
  },
} as const;
