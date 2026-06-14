import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const roles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'REPORTING_MANAGER', 'EMPLOYEE'];

export function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">User Management</h1>
          <p className="text-muted">Manage users and role-based access control</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Add User</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted">Loading...</td></tr>
              ) : users?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted">No users</td></tr>
              ) : (
                users?.map((u: { id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }) => (
                  <tr key={u.id} className="border-b border-border">
                    <td className="py-3">{u.firstName} {u.lastName}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3"><Badge>{u.role.replace(/_/g, ' ')}</Badge></td>
                    <td className="py-3"><Badge variant={u.isActive ? 'success' : 'muted'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Role Permissions</CardTitle></CardHeader>
        <p className="mb-4 text-sm text-muted">Available roles: {roles.join(', ')}</p>
        <p className="text-sm text-muted">Permissions: View, Create, Edit, Delete, Approve, Export, Configure</p>
      </Card>
    </div>
  );
}
