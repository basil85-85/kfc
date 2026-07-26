import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a component render crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
          <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 border-rose-500/30 shadow-glow-crimson animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30">
              <FiAlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <span className="section-label text-rose-400">Application Error</span>
              <h1 className="font-display text-2xl font-black text-white">Something went wrong</h1>
              <p className="text-xs text-slate-300">
                An unexpected interface error occurred on this page. We've logged the event.
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="rounded-xl border border-rose-500/20 bg-slate-900/90 p-3 text-left overflow-x-auto text-[11px] font-mono text-rose-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 gap-2"
              >
                <FiRefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleReset}
                className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-5 gap-2"
              >
                <FiHome size={14} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
