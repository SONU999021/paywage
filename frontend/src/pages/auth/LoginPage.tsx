import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { setAuth } from '@/store/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { data: result } = await api.post('/auth/login', data);
      dispatch(setAuth(result));
      toast('Welcome back!', 'success');
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Login failed');
      setError(msg);
      toast(msg, 'error');
      console.error('[LoginPage]', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-card px-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">PR</div>
          <CardTitle>Welcome back</CardTitle>
          <p className="text-sm text-muted">Sign in to your PayWager account</p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {successMessage && (
            <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success" role="status">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}
          <Input label="Email" type="email" id="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" id="password" error={errors.password?.message} {...register('password')} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" {...register('rememberMe')} className="rounded border-border" />
              Remember me
            </label>
            <span className="text-sm text-muted">Forgot password?</span>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </Card>
    </div>
  );
}
