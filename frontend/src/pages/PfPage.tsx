import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

export function PfPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: records, isLoading } = useQuery({
    queryKey: ['pf-register', month, year],
    queryFn: async () => (await api.get('/reports/pf-register', { params: { month, year } })).data,
  });

  const totals = records?.reduce(
    (acc: { employee: number; employer: number }, r: { employeeContrib: number; employerContrib: number }) => ({
      employee: acc.employee + Number(r.employeeContrib),
      employer: acc.employer + Number(r.employerContrib),
    }),
    { employee: 0, employer: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">PF Management</h1>
          <p className="text-muted">Provident Fund register and compliance reports</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-border px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-border px-3 py-2 text-sm">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted">Employee Contribution</p><p className="text-2xl font-bold text-primary">{formatCurrency(totals?.employee || 0)}</p></Card>
        <Card><p className="text-sm text-muted">Employer Contribution</p><p className="text-2xl font-bold text-primary">{formatCurrency(totals?.employer || 0)}</p></Card>
        <Card><p className="text-sm text-muted">Total PF Liability</p><p className="text-2xl font-bold text-success">{formatCurrency((totals?.employee || 0) + (totals?.employer || 0))}</p></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>PF Register</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Basic Wages</th>
                <th className="pb-3 font-medium">Employee PF</th>
                <th className="pb-3 font-medium">Employer PF</th>
                <th className="pb-3 font-medium">EPS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">Loading...</td></tr>
              ) : records?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">No PF records for this period</td></tr>
              ) : (
                records?.map((r: { id: string; employee: { firstName: string; lastName: string; employeeCode: string }; basicWages: number; employeeContrib: number; employerContrib: number; epsContrib: number }) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-3">{r.employee.firstName} {r.employee.lastName} ({r.employee.employeeCode})</td>
                    <td className="py-3">{formatCurrency(Number(r.basicWages))}</td>
                    <td className="py-3">{formatCurrency(Number(r.employeeContrib))}</td>
                    <td className="py-3">{formatCurrency(Number(r.employerContrib))}</td>
                    <td className="py-3">{formatCurrency(Number(r.epsContrib))}</td>
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
