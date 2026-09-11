import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const root = document.getElementById('root');
  if (root && (!root.innerHTML || root.innerHTML === '')) {
    root.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#991b1b;background:#fef2f2;min-height:100vh;">
      <h2 style="font-size:22px;font-weight:bold;margin-bottom:12px;">Client Error Detected</h2>
      <p style="margin-bottom:12px;"><b>${msg}</b></p>
      <pre style="background:#fff;padding:16px;border-radius:8px;border:1px solid #fca5a5;overflow:auto;font-size:13px;">${error?.stack || ''}\nLine: ${lineNo}:${columnNo}\nFile: ${url}</pre>
      <button onclick="localStorage.clear();window.location.href='/login';" style="margin-top:16px;padding:10px 18px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">
        Clear Session &amp; Return to Login
      </button>
    </div>`;
  }
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#FEF2F2', minHeight: '100vh', color: '#991B1B' }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Application Error</h1>
          <p style={{ marginBottom: 16 }}>An error occurred while rendering the page:</p>
          <pre style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, border: '1px solid #FCA5A5', whiteSpace: 'pre-wrap', fontSize: 13, overflow: 'auto' }}>
            {this.state.error?.toString()}
            {"\n\nComponent Stack:\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ marginTop: 20, padding: '10px 20px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear Session &amp; Return to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)