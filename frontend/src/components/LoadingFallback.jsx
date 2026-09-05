import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <Loader2 size={48} className="animate-spin" color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '1rem', color: '#64748B', fontWeight: 600, fontFamily: 'sans-serif' }}>Memuat Aplikasi...</p>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};
