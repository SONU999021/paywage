import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Wallet, FileText,
  Building2, Shield, BarChart3, Upload, ScrollText, Bell, Settings, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/employees', icon: Users, label: 'Employees' },
  { to: '/app/attendance', icon: Clock, label: 'Attendance' },
  { to: '/app/leaves', icon: CalendarDays, label: 'Leave Management' },
  { to: '/app/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/app/salary-slips', icon: FileText, label: 'Salary Slips' },
  { to: '/app/pf', icon: Building2, label: 'PF Management' },
  { to: '/app/esi', icon: Shield, label: 'ESI Management' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports' },
  { to: '/app/import', icon: Upload, label: 'Excel Import' },
  { to: '/app/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/settings', icon: Settings, label: 'Company Settings' },
  { to: '/app/users', icon: UserCog, label: 'User Management' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">PR</div>
        <div>
          <p className="text-sm font-bold text-text">PayWager</p>
          <p className="text-xs text-muted">Workforce Management</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-white' : 'text-muted hover:bg-card hover:text-text',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
