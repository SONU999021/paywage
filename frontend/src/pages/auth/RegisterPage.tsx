import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const schema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  address: z.string().min(5, 'Address required'),
  pan: z.string().regex(PAN_REGEX, 'Invalid PAN (e.g. ABCDE1234F)'),
  gst: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === '' || GST_REGEX.test(v), { message: 'Invalid GST number' }),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Need uppercase letter')
    .regex(/[a-z]/, 'Need lowercase letter')
    .regex(/[0-9]/, 'Need a number')
    .regex(/[^A-Za-z0-9]/, 'Need a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gst: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const payload = {
        ...data,
        pan: data.pan.toUpperCase(),
        gst: data.gst?.trim() || undefined,
      };
      await api.post('/auth/register', payload);
      toast('Registration successful! Please login.', 'success');
      navigate('/login', { replace: true, state: { message: 'Registration successful. Please login.' } });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Registration failed');
      setError(msg);
      toast(msg, 'error');
      console.error('[RegisterPage]', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-card px-4 py-8">
      <Card className="w-full max-w-lg bg-background">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">PR</div>
          <CardTitle>Register your company</CardTitle>
          <p className="text-sm text-muted">Start your free trial with PayWager</p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}
          <Input label="Company Name *" id="companyName" error={errors.companyName?.message} {...register('companyName')} />
          <Input label="Address *" id="address" error={errors.address?.message} {...register('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="PAN Number *" id="pan" placeholder="ABCDE1234F" error={errors.pan?.message} {...register('pan')} />
            <Input label="GST Number" id="gst" placeholder="Optional" error={errors.gst?.message} {...register('gst')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone *" id="phone" error={errors.phone?.message} {...register('phone')} />
            <Input label="Email *" type="email" id="email" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password *" type="password" id="password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password *" type="password" id="confirmPassword" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </Card>
    </div>
  );
}
