import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  basicSalary: z.coerce.number().min(0, 'Must be 0 or more'),
  hra: z.coerce.number().min(0).default(0),
  specialAllowance: z.coerce.number().min(0).default(0),
  pan: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EmployeeFormModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { basicSalary: 0, hra: 0, specialAllowance: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast('Employee created successfully', 'success');
      reset();
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string; details?: { message: string }[] } } }) => {
      const details = err.response?.data?.details?.map((d) => d.message).join(', ');
      toast(details || err.response?.data?.error || 'Failed to create employee', 'error');
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal open={open} onClose={onClose} title="Add Employee" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name *" id="firstName" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name *" id="lastName" error={errors.lastName?.message} {...register('lastName')} />
          <Input label="Email" type="email" id="email" error={errors.email?.message} {...register('email')} />
          <Input label="Mobile" id="mobile" {...register('mobile')} />
          <Input label="Designation" id="designation" {...register('designation')} />
          <Input label="PAN" id="pan" {...register('pan')} />
          <Input label="Date of Joining" type="date" id="dateOfJoining" {...register('dateOfJoining')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Basic Salary *" type="number" id="basicSalary" error={errors.basicSalary?.message} {...register('basicSalary')} />
          <Input label="HRA" type="number" id="hra" {...register('hra')} />
          <Input label="Special Allowance" type="number" id="specialAllowance" {...register('specialAllowance')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
