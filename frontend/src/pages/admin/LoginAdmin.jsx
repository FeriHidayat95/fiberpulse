import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, ShieldCheck, Cpu, Wifi, Server, ArrowRight } from 'lucide-react';
import './LoginAdmin.css';

export const LoginAdmin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Portal Login Admin — FiberPulse Technologies Inc. (FiberPulse)';
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
        navigate('/admin/dashboard');
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
    <main className="enterprise-login-container" role="main">
      {/* Left Banner Enterprise Section */}
      <section className="login-banner" aria-label="Informasi Platform Enterprise ISP">
        <div className="banner-mesh-bg"></div>
        <div className="banner-content">
          <div className="banner-hero-text">
            <h1>Enterprise ISP Management Platform</h1>
            <p>Sistem terintegrasi pemetaan ODP (GIS), manajemen inventaris gudang, order pelanggan, dan penugasan teknisi realtime.</p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><Server size={18} /></div>
              <span>Pemetaan ODP (GIS) & Kapasitas Port Realtime</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Cpu size={18} /></div>
              <span>Manajemen Stok Gudang Hardware & Tabel Meteran</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={18} /></div>
              <span>Otomatisasi Penugasan & AI Handover WhatsApp</span>
            </div>
          </div>

          <footer className="banner-footer-info">
            © {new Date().getFullYear()} FIBERPULSE TECHNOLOGIES INC. (FiberPulse). All rights reserved.
          </footer>
        </div>
      </section>

      {/* Right Login Form Container */}
      <section className="login-form-container" aria-label="Formulir Authentifikasi Portal Admin">
        <div className="login-form-wrapper">
          <header className="login-header-block" style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src="/logo-sgt.png" alt="Logo FiberPulse - FiberPulse Technologies Inc." style={{ height: '48px', objectFit: 'contain', marginBottom: '1rem' }} />
            <h1 className="login-title">Masuk ke Portal Admin</h1>
            <p className="login-subtitle">
              Silakan masukkan kredensial akun eksekutif Anda untuk mengelola operasional ISP.
            </p>
          </header>

          {error && (
            <div className="login-error-alert" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form" aria-label="Form Login Admin">
            <div className="form-group">
              <Input 
                id="admin-email-input"
                label="Alamat Email Admin"
                type="email"
                placeholder="nama@fiberpulse.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            
            <div className="form-group">
              <Input 
                id="admin-password-input"
                label="Kata Sandi / Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                rightElement={
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                    aria-label={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                }
              />
            </div>

            <Button 
              type="submit" 
              className="enterprise-login-btn" 
              disabled={loading}
              aria-label="Tombol Masuk ke Dashboard Admin"
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Memverifikasi Kredensial...
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  Masuk ke Dashboard Admin <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <footer className="security-notice">
            <ShieldCheck size={16} color="#42A1D3" />
            <span style={{ whiteSpace: 'nowrap' }}>Koneksi Aman Terenkripsi TLS 256-bit SSL</span>
          </footer>
        </div>
      </section>
    </main>
  );
};
