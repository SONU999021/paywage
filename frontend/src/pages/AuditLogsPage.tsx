import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: async () => (await api.get('/audit-logs', { params: { page, limit: 50 } })).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Audit Logs</h1>
        <p className="text-muted">Track every action with user, timestamp, and change history</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Date & Time</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Module</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">Loading...</td></tr>
              ) : data?.logs?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">No audit logs</td></tr>
              ) : (
                data?.logs?.map((log: { id: string; createdAt: string; user?: { firstName: string; lastName: string }; module: string; action: string; ipAddress?: string }) => (
                  <tr key={log.id} className="border-b border-border">
                    <td className="py-3">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                    <td className="py-3">{log.module}</td>
                    <td className="py-3">{log.action}</td>
                    <td className="py-3 text-muted">{log.ipAddress || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.total > 50 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
