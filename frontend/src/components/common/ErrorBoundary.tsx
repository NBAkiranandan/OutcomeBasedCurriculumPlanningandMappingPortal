import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    error: null,
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
        <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center border border-danger-100">
            <div className="w-16 h-16 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-danger-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">Something went wrong</h1>
            <p className="text-text-secondary text-sm mb-6 bg-surface-hover p-4 rounded-xl border border-border text-left overflow-auto max-h-32">
              {this.state.error?.message || 'An unexpected error occurred in the application.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-button"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
