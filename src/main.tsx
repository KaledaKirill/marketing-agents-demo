import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './app/App';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Intergam rendering error', error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <div className="mx-auto max-w-lg p-10">
        <h1 className="text-2xl">Something interrupted your workspace.</h1>
        <p className="my-5 text-sm leading-7 text-muted-foreground">
          Refresh to try again. Your previously saved data remains in this browser.
        </p>
        <button
          className="rounded-lg bg-primary px-4 py-3 text-sm text-white"
          onClick={() => location.reload()}
        >
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
