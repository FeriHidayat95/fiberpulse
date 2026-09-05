import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardCheck, Compass, Zap, Clock, UserCheck, Radio, History, MapPin, LogOut, User, X } from 'lucide-react';
import './TeknisiLayout.css';

export const TeknisiLayout = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Teknisi';
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileModalRef.current && !profileModalRef.current.contains(e.target)) {
        setShowProfileModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      await fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.removeItem('sanctum_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    navigate('/teknisi/login');
  };

  return (
    <div className="teknisi-root">
      <div className="teknisi-mobile-wrapper">
        {/* Enterprise Top Header Bar (Fixed 72px Height) */}
        <header className="teknisi-top-header">
          {/* FiberPulse Direct Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo-sgt.png" alt="Logo FiberPulse" style={{ maxHeight: '36px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* User Profile Trigger Button */}
          <button 
            onClick={() => setShowProfileModal(!showProfileModal)}
            title="Menu Profil & Logout"
            aria-label="Menu Profil & Logout"
            style={{
              position: 'relative',
              cursor: 'pointer',
              width: '42px',
              height: '42px',
              padding: 0,
              boxSizing: 'border-box',
              borderRadius: '12px',
              backgroundColor: showProfileModal ? '#EFF6FF' : '#F8FAFC',
              border: showProfileModal ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
              flexShrink: 0
            }}>
              <User size={18} color="#FFFFFF" />
            </div>
            
            {/* Active Online Dot Badge */}
            <span style={{
              position: 'absolute',
              bottom: '3px',
              right: '3px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '2px solid #FFFFFF'
            }} />
          </button>
        </header>

        {/* Executive Profile & Logout Slide-up Modal Drawer */}
        {showProfileModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}>
            <div ref={profileModalRef} className="tk-profile-modal-drawer">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>Profil Teknisi</div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div className="tk-dropdown-user-hero">
                <div className="tk-dropdown-avatar">
                  <User size={22} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem', lineHeight: 1.2 }}>{userName}</div>
                  <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    Senior Field Engineer
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.675rem', backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', marginTop: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span> On-Duty Active
                  </div>
                </div>
              </div>
              
              <div className="tk-dropdown-divider"></div>
              
              <button 
                className="tk-dropdown-item" 
                onClick={() => { setShowProfileModal(false); navigate('/teknisi/tugas'); }}
              >
                <ClipboardCheck size={18} color="#2563EB" /> <span>Daftar Tugas Aktif</span>
              </button>

              <button 
                className="tk-dropdown-item" 
                onClick={() => { setShowProfileModal(false); navigate('/teknisi/peta-odp'); }}
              >
                <Compass size={18} color="#3B82F6" /> <span>Peta ODP (GIS)</span>
              </button>

              <button 
                className="tk-dropdown-item" 
                onClick={() => { setShowProfileModal(false); navigate('/teknisi/riwayat'); }}
              >
                <Clock size={18} color="#64748B" /> <span>Riwayat Penugasan</span>
              </button>

              <div className="tk-dropdown-divider"></div>

              <button 
                className="tk-dropdown-item logout" 
                onClick={handleLogout}
              >
                <LogOut size={18} color="#EF4444" /> <span style={{ color: '#EF4444', fontWeight: 800 }}>Logout / Keluar</span>
              </button>
            </div>
          </div>
        )}

        <main className="teknisi-content">
          <Outlet />
        </main>

        {/* Enterprise Elevated Notch Bottom Navigation Bar (5 Slots) */}
        <nav className="tk-bottom-nav" aria-label="Navigasi Utama Teknisi">
          {/* Slot 1: Tugas Saya */}
          <NavLink to="/teknisi/tugas" className={({isActive}) => isActive ? "tk-nav-item active" : "tk-nav-item"}>
            <div className="tk-nav-icon-wrapper">
              <ClipboardCheck size={20} />
            </div>
            <span>Tugas Saya</span>
          </NavLink>
          
          {/* Slot 2: Pemetaan ODP */}
          <NavLink to="/teknisi/peta-odp" className={({isActive}) => isActive ? "tk-nav-item active" : "tk-nav-item"}>
            <div className="tk-nav-icon-wrapper">
              <Compass size={20} />
            </div>
            <span>Pemetaan ODP</span>
          </NavLink>

          {/* Slot 3: Center Elevated Floating Circle Action */}
          <div className="tk-nav-center-slot">
            <button 
              className="tk-nav-center-btn"
              onClick={() => navigate('/teknisi/tugas')}
              title="Tugas Utama Operasional"
            >
              <Zap size={24} color="#FFFFFF" />
            </button>
          </div>

          {/* Slot 4: Riwayat Tugas */}
          <NavLink to="/teknisi/riwayat" className={({isActive}) => isActive ? "tk-nav-item active" : "tk-nav-item"}>
            <div className="tk-nav-icon-wrapper">
              <Clock size={20} />
            </div>
            <span>Riwayat Tugas</span>
          </NavLink>

          {/* Slot 5: Profile (Paling Kanan Sesuai Permintaan User) */}
          <button 
            onClick={() => setShowProfileModal(true)}
            className={`tk-nav-item ${showProfileModal ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="tk-nav-icon-wrapper">
              <UserCheck size={20} />
            </div>
            <span>Profil</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
