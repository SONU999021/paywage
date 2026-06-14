import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: async () => (await api.get('/company')).data,
  });

  if (isLoading) return <div className="text-muted">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Company Settings</h1>
        <p className="text-muted">Manage company profile, departments, and branches</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-muted">Company Name</dt><dd className="font-medium">{company?.name}</dd></div>
            <div><dt className="text-muted">Address</dt><dd>{company?.address}</dd></div>
            <div><dt className="text-muted">PAN</dt><dd>{company?.pan}</dd></div>
            <div><dt className="text-muted">GST</dt><dd>{company?.gst || '—'}</dd></div>
            <div><dt className="text-muted">Email</dt><dd>{company?.email}</dd></div>
            <div><dt className="text-muted">Phone</dt><dd>{company?.phone}</dd></div>
            <div><dt className="text-muted">Payroll Cycle</dt><dd>{company?.payrollCycle}</dd></div>
          </dl>
          <Button className="mt-4" variant="outline">Edit Profile</Button>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Departments</CardTitle>
            <Button size="sm" variant="outline">Add</Button>
          </CardHeader>
          <ul className="space-y-2">
            {company?.departments?.map((d: { id: string; name: string }) => (
              <li key={d.id} className="rounded-lg border border-border px-4 py-2 text-sm">{d.name}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Branches</CardTitle>
            <Button size="sm" variant="outline">Add</Button>
          </CardHeader>
          <ul className="space-y-2">
            {company?.branches?.length === 0 ? (
              <li className="text-sm text-muted">No branches configured</li>
            ) : (
              company?.branches?.map((b: { id: string; name: string; address?: string }) => (
                <li key={b.id} className="rounded-lg border border-border px-4 py-2 text-sm">
                  <p className="font-medium">{b.name}</p>
                  {b.address && <p className="text-muted">{b.address}</p>}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
