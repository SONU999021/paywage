import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

export function EsiPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const { data: records, isLoading } = useQuery({
    queryKey: ['esi-register', month, year],
    queryFn: async () => (await api.get('/reports/esi-register', { params: { month, year } })).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">ESI Management</h1>
          <p className="text-muted">Employee State Insurance — automatic eligibility for wages ≤ ₹21,000</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-border px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>ESI Register</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Gross Wages</th>
                <th className="pb-3 font-medium">Employee ESI</th>
                <th className="pb-3 font-medium">Employer ESI</th>
                <th className="pb-3 font-medium">Eligible</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">Loading...</td></tr>
              ) : records?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">No ESI records for this period</td></tr>
              ) : (
                records?.map((r: { id: string; employee: { firstName: string; lastName: string }; grossWages: number; employeeContrib: number; employerContrib: number; isEligible: boolean }) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-3">{r.employee.firstName} {r.employee.lastName}</td>
                    <td className="py-3">{formatCurrency(Number(r.grossWages))}</td>
                    <td className="py-3">{formatCurrency(Number(r.employeeContrib))}</td>
                    <td className="py-3">{formatCurrency(Number(r.employerContrib))}</td>
                    <td className="py-3"><Badge variant={r.isEligible ? 'success' : 'muted'}>{r.isEligible ? 'Yes' : 'No'}</Badge></td>
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
