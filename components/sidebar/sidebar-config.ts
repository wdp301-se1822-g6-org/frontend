import {
    LayoutDashboard,
    PieChart,
    CalendarCheck,
    Wrench,
    Car,
    Clock,
    Ticket,
    CreditCard,
    ClipboardList,
    Users,
    Layers,
    Crown,
    Settings,
} from 'lucide-react';

export const SIDEBAR_CONFIG = {
    admin: {
        title: 'Admin',
        textColor: 'text-primary',
        activeClass:
            'bg-primary text-white shadow-lg shadow-primary/25',
        avatarClass: 'bg-primary',
        navItems: [
            { href: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
            { href: '/admin/bookings', icon: CalendarCheck, label: 'Đặt lịch' },
            { href: '/admin/users', icon: Users, label: 'Người dùng' },
            { href: '/admin/vehicles', icon: Car, label: 'Phương tiện' },
            { href: '/admin/services', icon: Layers, label: 'Dịch vụ' },
            { href: '/admin/orders', icon: CreditCard, label: 'Hóa đơn' },
            { href: '/admin/shifts', icon: Clock, label: 'Ca làm việc' },
            { href: '/admin/tiers', icon: Crown, label: 'Hạng thành viên' },
            { href: '/admin/vouchers', icon: Ticket, label: 'Voucher' },
            { href: '/admin/settings', icon: Settings, label: 'Cài đặt' },
        ],
    },

    manager: {
        title: 'Manager',
        textColor: 'text-indigo-400',
        activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25',
        avatarClass: 'bg-indigo-500',
        navItems: [
            { href: '/manager', icon: LayoutDashboard, label: 'Tổng quan' },
            { href: '/manager/dashboard', icon: PieChart, label: 'Báo cáo vận hành' },
            { href: '/manager/orders', icon: CalendarCheck, label: 'Đơn đặt lịch' },
            { href: '/manager/work-orders', icon: Wrench, label: 'Vận hành rửa xe' },
            { href: '/manager/vehicles', icon: Car, label: 'Quản lý xe' },
            { href: '/manager/shifts', icon: Clock, label: 'Ca làm việc' },
            { href: '/manager/vouchers', icon: Ticket, label: 'Voucher' },
        ],
    },

    cashier: {
        title: 'Cashier',
        textColor: 'text-emerald-400',
        activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25',
        avatarClass: 'bg-emerald-500',
        navItems: [
            { href: '/cashier', icon: CreditCard, label: 'Quầy thu ngân' },
            { href: '/cashier/orders', icon: CalendarCheck, label: 'Lịch hẹn đặt trước' },
            { href: '/cashier/work-orders', icon: ClipboardList, label: 'Vận hành rửa xe' },
        ],
    },

    washer: {
        title: 'Washer',
        textColor: 'text-amber-400',
        activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-600/25',
        avatarClass: 'bg-amber-500',
        navItems: [
            { href: '/washer', icon: Wrench, label: 'Lịch rửa xe' },
        ],
    },
} as const;