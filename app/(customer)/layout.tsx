import ProtectedRoute from '@/components/shared/ProtectedRoute';

/**
 * Layout cho nhóm route khách hàng (booking, profile...).
 * Đặt ProtectedRoute một lần ở đây để bảo vệ toàn bộ trang con (booking, profile),
 * tránh lặp guard ở từng trang.
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>{children}</ProtectedRoute>
  );
}
