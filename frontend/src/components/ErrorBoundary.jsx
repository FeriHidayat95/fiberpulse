import React from 'react';
import { AlertCircle, RefreshCw, Home, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Terjadi kesalahan sistem');
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', 
          alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '2rem', boxSizing: 'border-box'
        }}>
          <div style={{ backgroundColor: '#FEE2E2', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.25rem' }}>
            <AlertCircle size={48} color="#EF4444" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textAlign: 'center' }}>
            Oops! Terjadi Kesalahan
          </h1>
          <p style={{ color: '#64748B', maxWidth: '440px', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            Sistem mendeteksi kendala rendering pada komponen. Silakan muat ulang halaman atau kembali ke beranda.
          </p>

          {/* Diagnostic Error Box */}
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>
              Pesan Kesalahan Teknis:
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {errorMsg}
            </div>
            {componentStack && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '0.7rem', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}>
                  Lihat Stack Komponen
                </summary>
                <pre style={{ fontSize: '0.65rem', color: '#7F1D1D', marginTop: '6px', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '150px' }}>
                  {componentStack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="outline" onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); window.location.reload(); }}>
              <RefreshCw size={16} className="mr-2" />
              Muat Ulang Halaman
            </Button>
            <Button onClick={() => window.location.href = '/admin/dashboard'}>
              <Home size={16} className="mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
