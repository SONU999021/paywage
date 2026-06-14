import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Lock, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

export function PayrollPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: runs } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => (await api.get('/payroll/runs')).data,
  });

  const { data: rules } = useQuery({
    queryKey: ['payroll-rules'],
    queryFn: async () => (await api.get('/payroll/rules')).data,
  });

  const processMutation = useMutation({
    mutationFn: () => api.post('/payroll/process', { month, year }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Payroll Processing</h1>
          <p className="text-muted">Process payroll with configurable rules and statutory deductions</p>
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
          <Button onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>
            <Play className="h-4 w-4" /> {processMutation.isPending ? 'Processing...' : 'Process Payroll'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payroll Runs</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {runs?.length === 0 ? (
              <p className="text-sm text-muted">No payroll runs yet</p>
            ) : (
              runs?.map((run: { id: string; month: number; year: number; status: string; totalNet: number; totalGross: number }) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-text">{new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-sm text-muted">Gross: {formatCurrency(Number(run.totalGross))} • Net: {formatCurrency(Number(run.totalNet))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={run.status === 'LOCKED' ? 'success' : run.status === 'PROCESSED' ? 'warning' : 'muted'}>{run.status}</Badge>
                    {run.status === 'PROCESSED' && (
                      <Button size="sm" variant="outline"><Lock className="h-3 w-3" /> Lock</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payroll Rules</CardTitle>
            <Button size="sm" variant="outline"><Plus className="h-3 w-3" /> Add Rule</Button>
          </CardHeader>
          <div className="space-y-3">
            {rules?.length === 0 ? (
              <p className="text-sm text-muted">No rules configured</p>
            ) : (
              rules?.map((rule: { id: string; name: string; description?: string; condition: { field: string; operator: string; value: unknown }; action: { type: string } }) => (
                <div key={rule.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium text-text">{rule.name}</p>
                  {rule.description && <p className="text-xs text-muted">{rule.description}</p>}
                  <p className="mt-2 font-mono text-xs text-primary">
                    IF {rule.condition.field} {rule.condition.operator} {String(rule.condition.value)} THEN {rule.action.type}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payroll Steps</CardTitle></CardHeader>
        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {['Fetch Attendance', 'Calculate Working Days', 'Apply Leave Rules', 'Apply Attendance Rules', 'Calculate Gross', 'Statutory Deductions', 'Net Salary', 'Generate Slips', 'Lock Payroll'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 rounded-lg bg-background p-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
