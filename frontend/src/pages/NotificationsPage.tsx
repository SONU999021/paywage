import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notification Center</h1>
          <p className="text-muted">Email, in-app, and WhatsApp notifications</p>
        </div>
        <Button variant="outline" onClick={() => markAllRead.mutate()}>Mark all read</Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card><p className="text-muted">Loading...</p></Card>
        ) : notifications?.length === 0 ? (
          <Card><p className="text-muted">No notifications</p></Card>
        ) : (
          notifications?.map((n: { id: string; title: string; message: string; event: string; channel: string; isRead: boolean; createdAt: string }) => (
            <Card key={n.id} className={!n.isRead ? 'border-primary/30 bg-primary/5' : ''}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text">{n.title}</p>
                    {!n.isRead && <Badge>New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.message}</p>
                  <p className="mt-2 text-xs text-muted">{n.event} • {n.channel} • {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
