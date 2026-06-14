import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Calendar, Wallet, Building2, Shield, Cake, Award } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingPayroll: number;
  monthlyPayrollCost: number;
  pfLiability: number;
  esiLiability: number;
  recentActivities: { action: string; module: string; createdAt: string; user?: { firstName: string; lastName: string } }[];
  upcomingBirthdays: { firstName: string; lastName: string; dateOfBirth: string }[];
  upcomingAnniversaries: { firstName: string; lastName: string; dateOfJoining: string }[];
}

interface StatCard {
  key: keyof DashboardStats;
  label: string;
  icon: typeof Users;
  color: string;
  format?: 'currency';
}

const statCards: StatCard[] = [
  { key: 'totalEmployees', label: 'Total Employees', icon: Users, color: 'text-primary' },
  { key: 'presentToday', label: 'Present Today', icon: UserCheck, color: 'text-success' },
  { key: 'absentToday', label: 'Absent Today', icon: UserX, color: 'text-danger' },
  { key: 'onLeaveToday', label: 'On Leave', icon: Calendar, color: 'text-warning' },
  { key: 'pendingPayroll', label: 'Pending Payroll', icon: Wallet, color: 'text-primary' },
  { key: 'monthlyPayrollCost', label: 'Monthly Payroll', icon: Wallet, color: 'text-success', format: 'currency' },
  { key: 'pfLiability', label: 'PF Liability', icon: Building2, color: 'text-primary', format: 'currency' },
  { key: 'esiLiability', label: 'ESI Liability', icon: Shield, color: 'text-primary', format: 'currency' },
];

export function DashboardPage() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats');
      return data;
    },
  });

  if (isLoading) {
    return <PageLoading message="Loading dashboard..." />;
  }

  if (isError) {
    return (
      <PageError
        message={(error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load dashboard'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-muted">Overview of your workforce and payroll</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const value = stats?.[card.key] ?? 0;
          const display = card.format === 'currency' ? formatCurrency(Number(value)) : String(value);
          return (
            <Card key={card.key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-text">{display}</p>
                </div>
                <div className={`rounded-lg bg-card p-3 ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {(stats?.recentActivities?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted">No recent activities</p>
            ) : (
              stats?.recentActivities?.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text">{a.action} — {a.module}</p>
                    <p className="text-xs text-muted">{a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'}</p>
                  </div>
                  <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Cake className="h-5 w-5 text-warning" />
              <CardTitle>Upcoming Birthdays</CardTitle>
            </CardHeader>
            {(stats?.upcomingBirthdays?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted">No birthdays this month</p>
            ) : (
              stats?.upcomingBirthdays?.map((e, i) => (
                <p key={i} className="text-sm text-text">{e.firstName} {e.lastName}</p>
              ))
            )}
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Work Anniversaries</CardTitle>
            </CardHeader>
            {(stats?.upcomingAnniversaries?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted">No anniversaries this month</p>
            ) : (
              stats?.upcomingAnniversaries?.map((e, i) => (
                <p key={i} className="text-sm text-text">{e.firstName} {e.lastName}</p>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
