/**
 * Error Boundary Component
 * Catches React component errors and provides fallback UI
 */

import type React from 'react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to monitoring service (in production)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service like Sentry
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>
              We apologize for the inconvenience. The application encountered an unexpected error.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="reload-button">
                Reload Page
              </button>
            </div>
          </div>

          <style jsx>{`
                        .error-boundary {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 400px;
                            padding: 20px;
                            background: var(--background-primary);
                        }

                        .error-content {
                            max-width: 500px;
                            text-align: center;
                        }

                        .error-content h2 {
                            color: var(--error-color);
                            margin-bottom: 10px;
                        }

                        .error-content p {
                            color: var(--text-secondary);
                            margin-bottom: 20px;
                            line-height: 1.5;
                        }

                        .error-details {
                            margin: 20px 0;
                            text-align: left;
                        }

                        .error-details summary {
                            cursor: pointer;
                            color: var(--primary-color);
                            font-weight: bold;
                            margin-bottom: 10px;
                        }

                        .error-stack {
                            background: var(--background-secondary);
                            border: 1px solid var(--border-color);
                            border-radius: 4px;
                            padding: 10px;
                            font-size: 12px;
                            color: var(--text-primary);
                            overflow-x: auto;
                            white-space: pre-wrap;
                            max-height: 200px;
                            overflow-y: auto;
                        }

                        .error-actions {
                            display: flex;
                            gap: 10px;
                            justify-content: center;
                        }

                        .retry-button,
                        .reload-button {
                            padding: 10px 20px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s ease;
                        }

                        .retry-button {
                            background: var(--primary-color);
                            color: white;
                        }

                        .retry-button:hover {
                            background: var(--primary-color-hover);
                        }

                        .reload-button {
                            background: var(--background-secondary);
                            color: var(--text-primary);
                            border: 1px solid var(--border-color);
                        }

                        .reload-button:hover {
                            background: var(--background-hover);
                        }
                    `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier usage
export const ErrorBoundaryWrapper: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}> = (props) => <ErrorBoundary {...props} />

export default ErrorBoundary
