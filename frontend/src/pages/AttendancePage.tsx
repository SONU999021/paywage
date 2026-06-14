import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { MarkAttendanceModal } from '@/components/attendance/MarkAttendanceModal';
import { ImportAttendanceModal } from '@/components/attendance/ImportAttendanceModal';

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'muted'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  HALF_DAY: 'warning',
  LEAVE: 'muted',
  HOLIDAY: 'muted',
  WEEK_OFF: 'muted',
};

export function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMark, setShowMark] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const { data } = await api.get('/attendance', { params: { date } });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Attendance Management</h1>
          <p className="text-muted">Track daily attendance — manual, biometric, Excel, or API</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button onClick={() => setShowMark(true)}>
            <Plus className="h-4 w-4" /> Mark Attendance
          </Button>
        </div>
      </div>

      <MarkAttendanceModal open={showMark} onClose={() => setShowMark(false)} defaultDate={date} />
      <ImportAttendanceModal open={showImport} onClose={() => setShowImport(false)} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Attendance</CardTitle>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
        </CardHeader>
        {isLoading ? (
          <PageLoading message="Loading attendance..." />
        ) : isError ? (
          <PageError
            message={(error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load attendance'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Check In</th>
                  <th className="pb-3 font-medium">Check Out</th>
                  <th className="pb-3 font-medium">Hours</th>
                  <th className="pb-3 font-medium">Late</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data?.records?.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted">No attendance records for this date. Use Mark Attendance to add records.</td></tr>
                ) : (
                  data?.records?.map((r: { id: string; employee: { firstName: string; lastName: string; employeeCode: string }; checkIn?: string; checkOut?: string; workingHours: number; lateMinutes: number; status: string; source: string }) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="py-3">{r.employee?.firstName} {r.employee?.lastName} <span className="text-muted">({r.employee?.employeeCode})</span></td>
                      <td className="py-3">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</td>
                      <td className="py-3">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                      <td className="py-3">{Number(r.workingHours).toFixed(1)}h</td>
                      <td className="py-3">{r.lateMinutes > 0 ? `${r.lateMinutes}m` : '—'}</td>
                      <td className="py-3"><Badge variant={statusVariant[r.status] || 'muted'}>{r.status}</Badge></td>
                      <td className="py-3 text-muted">{r.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
