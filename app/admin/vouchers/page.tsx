'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { VoucherManagement } from '@/components/voucher/VoucherManagement';

export default function AdminVouchersPage() {
  return (
    <>
      <AdminTopbar
        title='Voucher'
        subtitle='Cấp và quản lý voucher rửa miễn phí cho khách hàng'
      />
      <VoucherManagement mode='admin' />
    </>
  );
}
