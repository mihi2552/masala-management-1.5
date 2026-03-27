import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-red-100 max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mb-6 text-slate-600">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="mb-6 rounded-lg bg-slate-50 p-4 text-left">
              <p className="text-xs font-mono text-red-600 break-all">
                {this.state.error?.toString() || 'Unknown Error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-orange-500 py-3 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
