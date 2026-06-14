import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'muted'> = {
  PENDING: 'warning',
  MANAGER_APPROVED: 'warning',
  HR_APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'muted',
};

export function LeavesPage() {
  const { data: types, isLoading: typesLoading, isError: typesError, error: typesErr, refetch: refetchTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => (await api.get('/leaves/types')).data as { id: string; name: string; annualAllocation: number; isPaid: boolean }[],
  });

  const { data: requests, isLoading: reqLoading, isError: reqError, error: reqErr, refetch: refetchReq } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => (await api.get('/leaves/requests')).data,
  });

  if (typesLoading || reqLoading) return <PageLoading message="Loading leave management..." />;

  if (typesError || reqError) {
    const err = typesErr || reqErr;
    return (
      <PageError
        message={(err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load leave data'}
        onRetry={() => { refetchTypes(); refetchReq(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Leave Management</h1>
          <p className="text-muted">Configure leave types and manage leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Plus className="h-4 w-4" /> Add Leave Type</Button>
          <Button><Plus className="h-4 w-4" /> Apply Leave</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(types?.length ?? 0) === 0 ? (
          <Card><p className="text-sm text-muted">No leave types configured yet.</p></Card>
        ) : (
          types?.map((t) => (
            <Card key={t.id}>
              <p className="font-medium text-text">{t.name}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{t.annualAllocation}</p>
              <p className="text-xs text-muted">{t.isPaid ? 'Paid' : 'Unpaid'} • Annual allocation</p>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Leave Type</th>
                <th className="pb-3 font-medium">Period</th>
                <th className="pb-3 font-medium">Days</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!requests || requests.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted">No leave requests</td></tr>
              ) : (
                requests.map((r: { id: string; employee: { firstName: string; lastName: string }; leaveType: { name: string }; startDate: string; endDate: string; days: number; status: string }) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-3">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="py-3">{r.leaveType?.name}</td>
                    <td className="py-3">{formatDate(r.startDate)} — {formatDate(r.endDate)}</td>
                    <td className="py-3">{r.days}</td>
                    <td className="py-3"><Badge variant={statusVariant[r.status] || 'muted'}>{r.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="py-3">
                      {r.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Approve</Button>
                          <Button size="sm" variant="danger">Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
