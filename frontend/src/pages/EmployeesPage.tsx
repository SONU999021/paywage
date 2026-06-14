import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { formatCurrency } from '@/lib/utils';

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation?: string;
  department?: { name: string };
  grossSalary: number;
  status: string;
}

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employees', search, page],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params: { search, page, limit: 20 } });
      return data as { employees: Employee[]; total: number; totalPages: number };
    },
  });

  if (isLoading) return <PageLoading message="Loading employees..." />;
  if (isError) {
    return (
      <PageError
        message={(error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load employees'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Employee Management</h1>
          <p className="text-muted">Manage employee profiles and salary structures</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <EmployeeFormModal open={showForm} onClose={() => setShowForm(false)} />

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Designation</th>
                <th className="pb-3 font-medium">Gross Salary</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.employees?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted">No employees found. Click Add Employee to create one.</td></tr>
              ) : (
                data?.employees?.map((emp) => (
                  <tr key={emp.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-primary">{emp.employeeCode}</td>
                    <td className="py-3">{emp.firstName} {emp.lastName}</td>
                    <td className="py-3 text-muted">{emp.department?.name || '—'}</td>
                    <td className="py-3 text-muted">{emp.designation || '—'}</td>
                    <td className="py-3">{formatCurrency(Number(emp.grossSalary))}</td>
                    <td className="py-3">
                      <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'muted'}>{emp.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm text-muted">Page {page} of {data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
