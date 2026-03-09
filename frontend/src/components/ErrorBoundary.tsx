import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#e10600', backgroundColor: '#0a0a0f', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Pitwall.ai - Error</h1>
          <p style={{ color: '#fff' }}>Something went wrong:</p>
          <pre style={{ color: '#ff6b6b', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#e10600', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
