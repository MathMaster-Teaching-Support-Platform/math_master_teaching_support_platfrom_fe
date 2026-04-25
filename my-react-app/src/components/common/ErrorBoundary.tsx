import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and display errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            Đã xảy ra lỗi
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '500px' }}>
            {this.state.error?.message || 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Thử lại
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Course-specific Error Boundary with custom styling
 */
export class CourseErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">
              <AlertCircle size={48} style={{ marginBottom: '1rem', color: '#ef4444' }} />
              <h2>Đã xảy ra lỗi với khóa học</h2>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                {this.state.error?.message || 'Không thể tải thông tin khóa học. Vui lòng thử lại sau.'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button className="btn secondary" onClick={this.handleReset}>
                  Thử lại
                </button>
                <button className="btn primary" onClick={() => window.location.reload()}>
                  Tải lại trang
                </button>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
