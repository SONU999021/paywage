import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PayWager ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-text">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-muted">{this.state.message || 'An unexpected error occurred on this page.'}</p>
          <Button className="mt-6" onClick={() => this.setState({ hasError: false, message: '' })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
