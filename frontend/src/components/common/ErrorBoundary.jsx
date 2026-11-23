import React from 'react';
import Button from '../ui/Button';

/**
 * Top-level and layout-level ErrorBoundary component.
 * Catches rendering exceptions and displays an on-brand fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-8, 32px)',
            textAlign: 'center',
            color: 'var(--on-surface, #e5e2e1)',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: 'var(--space-4, 16px)',
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-headline, 24px)',
              fontWeight: 700,
              margin: '0 0 var(--space-2, 8px) 0',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--on-surface-variant, #ab8986)',
              fontSize: 'var(--fs-body-sm, 14px)',
              maxWidth: '420px',
              margin: '0 0 var(--space-6, 24px) 0',
              lineHeight: 1.5,
            }}
          >
            {this.state.error?.message || 'An unexpected rendering error occurred. Please try again.'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3, 12px)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button variant="primary" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
