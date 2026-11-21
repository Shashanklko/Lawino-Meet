import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LawinoMeet Caught UI Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                View Rendering Error
              </h3>
              <p className="text-xs text-stone-500 font-sans mt-1">
                {this.state.error?.message || 'A visual component encountered an issue.'}
              </p>
            </div>
            {this.state.errorInfo && (
              <pre className="text-[10px] text-stone-500 bg-stone-50 p-2.5 rounded-lg text-left overflow-x-auto max-h-32 font-mono">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-3.5 py-2 rounded-xl bg-[#831826] text-white text-xs font-semibold hover:opacity-90 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
