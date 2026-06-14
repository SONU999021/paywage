import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const reportTypes = [
  { id: 'attendance', name: 'Attendance Report', endpoint: '/reports/attendance' },
  { id: 'payroll', name: 'Payroll Register', endpoint: '/reports/payroll-register' },
  { id: 'pf', name: 'PF Register', endpoint: '/reports/pf-register' },
  { id: 'esi', name: 'ESI Register', endpoint: '/reports/esi-register' },
  { id: 'dept', name: 'Department Cost', endpoint: '/reports/department-cost' },
];

export function ReportsPage() {
  const { data: deptCost } = useQuery({
    queryKey: ['department-cost'],
    queryFn: async () => (await api.get('/reports/department-cost')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Reports</h1>
        <p className="text-muted">Generate and export payroll, attendance, and compliance reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-base">{report.name}</CardTitle>
            </CardHeader>
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
              <Button size="sm" variant="outline"><Download className="h-4 w-4" /> PDF</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Department Cost Report</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {deptCost?.length === 0 ? (
                <tr><td colSpan={2} className="py-8 text-center text-muted">No data</td></tr>
              ) : (
                deptCost?.map((d: { department: string; totalCost: number }) => (
                  <tr key={d.department} className="border-b border-border">
                    <td className="py-3">{d.department}</td>
                    <td className="py-3 font-medium">{formatCurrency(d.totalCost)}</td>
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
