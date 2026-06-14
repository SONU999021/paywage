import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PageLoading } from '@/components/ui/PageState';

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  date: z.string().min(1, 'Date is required'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEK_OFF']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function MarkAttendanceModal({ open, onClose, defaultDate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees-all'],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params: { limit: 500 } });
      return data as { employees: { id: string; employeeCode: string; firstName: string; lastName: string }[] };
    },
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: defaultDate || new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/attendance', { ...data, source: 'MANUAL' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast('Attendance saved successfully', 'success');
      reset({ date: defaultDate || new Date().toISOString().split('T')[0], status: 'PRESENT', employeeId: '' });
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast(err.response?.data?.error || 'Failed to save attendance', 'error');
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Mark Attendance">
      {isLoading ? (
        <PageLoading message="Loading employees..." />
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label htmlFor="employeeId" className="mb-1.5 block text-sm font-medium text-text">Employee *</label>
            <select
              id="employeeId"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('employeeId')}
            >
              <option value="">Select employee</option>
              {employeesData?.employees?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="mt-1 text-xs text-danger">{errors.employeeId.message}</p>}
          </div>
          <Input label="Date *" type="date" id="date" error={errors.date?.message} {...register('date')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Check In" type="time" id="checkIn" {...register('checkIn')} />
            <Input label="Check Out" type="time" id="checkOut" {...register('checkOut')} />
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-text">Status *</label>
            <select
              id="status"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('status')}
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="WEEK_OFF">Week Off</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
