import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Wrench } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './LoginTeknisi.css';

export const LoginTeknisi = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useDocumentTitle('Login Teknisi Lapangan — FiberPulse');

  useEffect(() => {
    const savedEmail = localStorage.getItem('tk_saved_email');
    const savedPassword = localStorage.getItem('tk_saved_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('sanctum_token', json.token);
        localStorage.setItem('user_role', json.user.role);
        localStorage.setItem('user_name', json.user.name);
        localStorage.setItem('user_id', json.user.id);
        
        if (rememberMe) {
          localStorage.setItem('tk_saved_email', email);
          localStorage.setItem('tk_saved_password', password);
        } else {
          localStorage.removeItem('tk_saved_email');
          localStorage.removeItem('tk_saved_password');
        }

        navigate('/teknisi/tugas');
      } else {
        setError(json.message || 'Login gagal, periksa email dan password Anda!');
      }
    } catch (err) {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="tk-login-root" role="main">
      <div className="tk-login-mobile">
        {/* Top Header Section with FiberPulse Logo */}
        <header className="tk-login-header">
          <img src="/logo-sgt.png" alt="Logo FiberPulse" style={{ height: '42px', objectFit: 'contain', marginBottom: '0.75rem' }} />
          <h1 className="tk-brand-title">Portal Teknisi Lapangan</h1>
          <p className="tk-brand-subtitle">FiberPulse Technologies Inc. (FiberPulse)</p>
        </header>

        {/* Bottom Card Section */}
        <section className="tk-login-card" aria-label="Form Login Teknisi">
          <h2 className="tk-card-title">Masuk ke Akun</h2>
          <p className="tk-card-subtitle">Gunakan kredensial yang diberikan oleh Admin Sistem</p>

          <form className="tk-login-form" onSubmit={handleLogin}>
            <div className="tk-input-group">
              <label>Email Teknisi</label>
              <input 
                type="email" 
                placeholder="teknisi@fiberpulse.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #CBD5E1',
                  borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                  fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="tk-input-group">
              <label>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.75rem', border: '1px solid #CBD5E1',
                    borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                    fontWeight: 600, boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  aria-label={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  style={{ 
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', 
                    background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                    borderRadius: '4px', lineHeight: 1
                  }}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0 0.5rem 0', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#2563EB', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.75rem', color: '#475569', cursor: 'pointer', margin: 0, fontWeight: 600 }}>Ingat Saya di Perangkat Ini</label>
            </div>

            {error && (
              <div style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button type="submit" className="tk-btn-masuk" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk ke Portal Teknisi'} <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
