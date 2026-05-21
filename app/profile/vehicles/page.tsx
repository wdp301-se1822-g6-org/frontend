import VehicleManagement from '@/components/customer/VehicleManagement';

export const metadata = {
  title: 'Quản lý phương tiện - WashAuto',
  description: 'Quản lý danh sách xe cá nhân của bạn',
};

export default function VehiclesPage() {
  return <VehicleManagement />;
}
