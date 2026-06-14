import { Button } from '@/components/ui/Button';

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
      <p className="font-medium text-danger">Failed to load data</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
