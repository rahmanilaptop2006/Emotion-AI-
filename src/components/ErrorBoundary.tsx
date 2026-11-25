import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EMOTION AI ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#E7ECD9] text-[#1B251A] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-[28px] clay-card p-7 text-center space-y-4">
            <h1 className="font-display text-xl font-bold">EMOTION AI</h1>
            <p className="text-sm text-[#495847]">
              Something went wrong while loading this session. Reload to restore your workspace safely.
            </p>
            {this.state.errorMessage && (
              <div className="rounded-[14px] clay-well p-3 text-xs text-left break-words text-[#B42318]">
                {this.state.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="clay-btn-primary px-5 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
