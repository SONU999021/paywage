import { useQuery } from '@tanstack/react-query';
import { Download, Mail, MessageCircle, Eye } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

export function SalarySlipsPage() {
  const { data: slips, isLoading } = useQuery({
    queryKey: ['salary-slips'],
    queryFn: async () => (await api.get('/salary-slips')).data,
  });

  const downloadPdf = async (id: string) => {
    const response = await api.get(`/salary-slips/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-slip-${id}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Salary Slips</h1>
        <p className="text-muted">View, download, email, or share salary slips via WhatsApp</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Generated Salary Slips</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Period</th>
                <th className="pb-3 font-medium">Gross</th>
                <th className="pb-3 font-medium">Net Salary</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">Loading...</td></tr>
              ) : slips?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted">No salary slips generated. Process payroll first.</td></tr>
              ) : (
                slips?.map((slip: { id: string; employee: { firstName: string; lastName: string; employeeCode: string }; periodStart: string; periodEnd: string; grossSalary: number; netSalary: number }) => (
                  <tr key={slip.id} className="border-b border-border">
                    <td className="py-3">{slip.employee.firstName} {slip.employee.lastName} <span className="text-muted">({slip.employee.employeeCode})</span></td>
                    <td className="py-3">{formatDate(slip.periodStart)} — {formatDate(slip.periodEnd)}</td>
                    <td className="py-3">{formatCurrency(Number(slip.grossSalary))}</td>
                    <td className="py-3 font-medium text-success">{formatCurrency(Number(slip.netSalary))}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadPdf(slip.id)}><Download className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost"><Mail className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost"><MessageCircle className="h-4 w-4" /></Button>
                      </div>
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
