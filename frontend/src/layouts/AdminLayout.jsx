import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Map, Package, HardDrive, FileText, Settings, 
  LogOut, ShoppingCart, Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, 
  Menu, X, ChevronDown, ChevronRight, Bot, MessageSquare, Bell, User, Sliders, Wifi, AlertCircle, BookOpen, Wrench
} from 'lucide-react';
import './AdminLayout.css';

export const AdminLayout = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar drawer on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuGroups = [
    {
      id: 'dashboard',
      title: 'Dashboard & GIS',
      items: [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Pemetaan ODP', path: '/admin/pemetaan', icon: Map },
      ]
    },
    {
      id: 'inventory',
      title: 'Inventaris & Logistik',
      items: [
        { title: 'Aset Gudang', path: '/admin/aset-gudang', icon: Package },
        { title: 'Aset Masuk', path: '/admin/aset-masuk', icon: ArrowDownLeft },
        { title: 'Aset Keluar', path: '/admin/aset-keluar', icon: ArrowUpRight },
        { title: 'Pelacakan Terpasang', path: '/admin/monitoring-aset', icon: Wifi },
        { title: 'Monitoring Rusak', path: '/admin/monitoring-rusak', icon: AlertCircle },
      ]
    },
    {
      id: 'operation',
      title: 'Operasional & Layanan',
      items: [
        { title: 'Order Pelanggan', path: '/admin/order-pelanggan', icon: ShoppingCart },
        { title: 'Penugasan Teknisi', path: '/admin/penugasan', icon: Wrench },
        { title: 'Data Pelanggan', path: '/admin/pelanggan', icon: Users },
      ]
    },
    {
      id: 'crm',
      title: 'Sistem & Komunikasi',
      items: [
        { title: 'Pesan Pelanggan', path: '/admin/pesan', icon: MessageSquare },
        { title: 'Pengaturan CS AI', path: '/admin/pengaturan-ai', icon: Bot },
        { title: 'Manajemen Akun', path: '/admin/akun', icon: Settings },
        { title: 'Panduan & SOP', path: '/admin/panduan', icon: BookOpen },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      await fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.clear();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC', color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1100 }}
          className="md:hidden"
        />
      )}

      {/* Sidebar (Fixed 240px Width, Full Height, No Gap) */}
      <aside 
        style={{
          width: '240px',
          minWidth: '240px',
          maxWidth: '240px',
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 1150,
          height: '100vh'
        }}
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out fixed md:static inset-y-0 left-0 select-none shadow-xl md:shadow-none`}
      >
        <div>
          {/* Logo Header (Height 64px - Pas & Rata dengan Topbar) */}
          <div style={{ height: '64px', minHeight: '64px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/logo-sgt.png" 
                alt="FiberPulse - FiberPulse Technologies Inc." 
                style={{ height: '36px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} 
              />
            </div>

            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 130px)', fontSize: '0.8rem' }}>
            {menuGroups.map((group) => (
              <div key={group.id}>
                <div style={{ padding: '0 0.6rem', marginBottom: '0.35rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>
                  {group.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.15s ease',
                          color: isActive ? '#FFFFFF' : '#475569',
                          background: isActive ? 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)' : 'transparent',
                          boxShadow: isActive ? '0 4px 14px rgba(21, 44, 74, 0.22)' : 'none'
                        })}
                      >
                        <ItemIcon size={16} />
                        <span>{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#DC2626', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header (Height 64px) */}
        <header style={{ height: '64px', minHeight: '64px', maxHeight: '64px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1050, flexShrink: 0, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
          
          {/* Left: Mobile Toggle */}
          <div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right: Notification, Chat & Rounded Profile Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Notification Bell */}
            <button 
              onClick={() => navigate('/admin/pesan')}
              style={{ position: 'relative', padding: '8px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', cursor: 'pointer' }}
              title="Notifikasi"
            >
              <Bell size={16} />
              <span style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', backgroundColor: '#EF4444', borderRadius: '999px' }} />
            </button>

            {/* Chat Messages */}
            <button 
              onClick={() => navigate('/admin/pesan')}
              style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', cursor: 'pointer' }}
              title="Pesan Pelanggan"
            >
              <MessageSquare size={16} />
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

            {/* Rounded Clickable Profile Box */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                title="Buka Profil Pengguna"
              >
                <div className="sgt-gradient" style={{ width: '28px', height: '28px', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  AD
                </div>
                <div className="hidden sm:block" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>Admin SGT</div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Administrator</div>
                </div>
                <ChevronDown size={14} color="#94A3B8" />
              </div>

              {/* Profile Dropdown Menu */}
              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: '46px', width: '200px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '6px', fontSize: '0.75rem', zIndex: 1160 }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Admin SGT</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'monospace' }}>admin@fiberpulse.id</div>
                  </div>
                  
                  <button 
                    onClick={() => { navigate('/admin/akun'); setShowUserMenu(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', color: '#334155', fontWeight: 500, textAlign: 'left', backgroundColor: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User size={14} color="#94A3B8" />
                    <span>Profil Akun</span>
                  </button>
                  
                  <button 
                    onClick={() => { navigate('/admin/pengaturan-ai'); setShowUserMenu(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', color: '#334155', fontWeight: 500, textAlign: 'left', backgroundColor: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Bot size={14} color="#94A3B8" />
                    <span>Pengaturan CS AI</span>
                  </button>
                  
                  <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />
                  
                  <button 
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', color: '#DC2626', fontWeight: 600, textAlign: 'left', backgroundColor: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}

            </div>

          </div>

        </header>

        {/* Page Content Body (Scrollable) */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#F8FAFC', padding: '1.25rem 1.5rem' }}>
          <Outlet />
        </main>

      </div>

    </div>
  );
};
