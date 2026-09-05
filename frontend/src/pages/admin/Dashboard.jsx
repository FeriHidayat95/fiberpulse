import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  RefreshCw, HardDrive, Package, Wrench, Users, AlertCircle, 
  Plus, TrendingUp, Clock, ChevronRight, Map as MapIcon, Wifi
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TypeBadge } from '../../components/ui/TypeBadge';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon missing issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Default Operational Center: FiberPulse Technologies Inc. (Pagaden Barat, Subang)
const DEFAULT_OPERATIONAL_CENTER = [-6.5045062, 107.7731963];

// Enterprise Office / HQ Marker Icon for Dashboard
const createOfficeMarkerIcon = () => {
  const svgHtml = `
    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute; width: 42px; height: 42px; border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.35); pointer-events: none;
      "></div>
      <div style="
        position: relative; width: 34px; height: 34px; border-radius: 50%;
        background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%);
        border: 2px solid #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2), 0 0 8px rgba(37, 99, 235, 0.4);
        cursor: pointer;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
          <path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/>
          <path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
        </svg>
        <span style="
          position: absolute; top: -5px; right: -6px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF; padding: 1px 4px; border-radius: 999px;
          font-size: 0.52rem; font-weight: 900; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #FFFFFF; font-family: monospace; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">HQ</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-office-marker-icon',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21]
  });
};

// WiFi ODP Marker Icon for Dashboard
const createWifiMarkerIcon = (status, usedPorts = 0, totalPorts = 8) => {
  let color = '#10B981';
  let bg = '#ECFDF5';
  let border = '#059669';

  if (status === 'Penuh' || usedPorts >= totalPorts) {
    color = '#EF4444';
    bg = '#FEF2F2';
    border = '#DC2626';
  } else if (status === 'Hampir Penuh' || usedPorts >= totalPorts - 2) {
    color = '#F59E0B';
    bg = '#FFFBEB';
    border = '#D97706';
  }

  const svgHtml = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: relative; width: 30px; height: 30px; border-radius: 50%;
        background: linear-gradient(135deg, #FFFFFF 0%, ${bg} 100%);
        border: 2px solid ${border};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
        </svg>
        <span style="
          position: absolute; top: -4px; right: -4px;
          background-color: ${border}; color: #FFFFFF;
          padding: 0 3px; min-width: 14px; height: 14px; border-radius: 999px;
          font-size: 0.52rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #FFFFFF; font-family: monospace;
        ">${usedPorts}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-wifi-marker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAset: 0,
    hardwareAset: 0,
    materialAset: 0,
    tugasHariIni: 0,
    pelangganAktif: 0,
    asetRusak: 0,
    totalOdp: 0
  });

  const [odpList, setOdpList] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [latestTasks, setLatestTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthlyChart, setMonthlyChart] = useState([]);

  useDocumentTitle('Dashboard Admin — FiberPulse');

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/summary?t=' + Date.now());
      const json = await res.json();
      if (json.success && json.data) {
        setStats({
          totalAset: json.data.assets?.total !== undefined ? json.data.assets.total : 0,
          hardwareAset: json.data.assets?.hardware !== undefined ? json.data.assets.hardware : 0,
          materialAset: json.data.assets?.material !== undefined ? json.data.assets.material : 0,
          tugasHariIni: json.data.tasks?.active !== undefined ? json.data.tasks.active : 0,
          pelangganAktif: json.data.customers?.total !== undefined ? json.data.customers.total : 0,
          asetRusak: (json.data.odp?.rusak || 0) + (json.data.assets?.damaged || 0),
          totalOdp: json.data.odp?.total !== undefined ? json.data.odp.total : 0
        });
        if (json.data.monthly_chart && Array.isArray(json.data.monthly_chart)) {
          setMonthlyChart(json.data.monthly_chart);
        }
      }

      const resOdp = await fetch('/api/odps?t=' + Date.now());
      const jsonOdp = await resOdp.json();
      if (Array.isArray(jsonOdp.data)) {
        setOdpList(jsonOdp.data);
      }

      const resOrders = await fetch('/api/orders?t=' + Date.now());
      const jsonOrders = await resOrders.json();
      if (Array.isArray(jsonOrders.data)) {
        setLatestOrders(jsonOrders.data.slice(0, 5));
      }

      const resTasks = await fetch('/api/tasks?t=' + Date.now());
      const jsonTasks = await resTasks.json();
      if (Array.isArray(jsonTasks.data)) {
        setLatestTasks(jsonTasks.data.slice(0, 5));
      }
    } catch (e) {
      console.log('Using offline dashboard fallback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Hero Operations Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
            Dashboard Utama
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Monitoring status perangkat, pelanggan, dan penugasan teknisi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Secondary Refresh Button */}
          <button 
            onClick={fetchDashboardStats} 
            disabled={loading}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh</span>
          </button>

          {/* Primary Action Button (FiberPulse Gradient) */}
          <button 
            onClick={() => navigate('/admin/order-pelanggan')} 
            className="sgt-btn-primary"
            style={{
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <Plus size={15} />
            <span>Order Baru</span>
          </button>

        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Stok Perangkat */}
        <div 
          onClick={() => navigate('/admin/aset-gudang')}
          style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>STOK PERANGKAT</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
            {stats.hardwareAset || 0} Unit
          </div>
        </div>

        {/* Card 2: Stok Kabel FO */}
        <div 
          onClick={() => navigate('/admin/aset-gudang')}
          style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>KABEL FO</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
            {stats.materialAset || 0} m
          </div>
        </div>

        {/* Card 3: Tugas Hari Ini */}
        <div 
          onClick={() => navigate('/admin/penugasan')}
          style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TUGAS HARI INI</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em' }}>
            {stats.tugasHariIni || 0} Tugas
          </div>
        </div>

        {/* Card 4: Pelanggan Aktif */}
        <div 
          onClick={() => navigate('/admin/pelanggan')}
          style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>PELANGGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0D9488', letterSpacing: '-0.02em' }}>
            {stats.pelangganAktif || 0} User
          </div>
        </div>

        {/* Card 5: Aset Rusak */}
        <div 
          onClick={() => navigate('/admin/monitoring-rusak')}
          style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
          className="col-span-2 sm:col-span-1"
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>ASET RUSAK</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.02em' }}>
            {stats.asetRusak || 0} Item
          </div>
        </div>

      </div>

      {/* Middle Grid: Peta Sebaran ODP & Tugas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left (2 cols): Peta Sebaran ODP */}
        <div className="lg:col-span-2" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapIcon size={16} color="#2563EB" />
              <span>Peta Sebaran ODP</span>
            </h3>
            <Link 
              to="/admin/pemetaan" 
              style={{ fontSize: '0.75rem', color: '#2563EB', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Lihat peta</span>
              <span style={{ fontSize: '0.9rem' }}>↗</span>
            </Link>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: '260px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0', isolation: 'isolate' }}>
            <MapContainer 
              center={DEFAULT_OPERATIONAL_CENTER} 
              zoom={15} 
              style={{ width: '100%', height: '100%', minHeight: '260px' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Office HQ Marker */}
              <Marker position={DEFAULT_OPERATIONAL_CENTER} icon={createOfficeMarkerIcon()}>
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px', minWidth: '160px', fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.8rem' }}>🏢 KANTOR PUSAT FiberPulse</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Sumurgintung, Pagaden Barat</div>
                  </div>
                </Popup>
              </Marker>

              {/* Live ODP Markers */}
              {odpList.map(odp => {
                const lat = parseFloat(odp.latitude);
                const lng = parseFloat(odp.longitude);
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
                const isFull = (odp.used_ports || 0) >= (odp.total_ports || 8);
                return (
                  <Marker 
                    key={odp.id} 
                    position={[lat, lng]} 
                    icon={createWifiMarkerIcon(odp.status || (isFull ? 'Penuh' : 'Aktif'), odp.used_ports || 0, odp.total_ports || 8)}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center', padding: '4px', minWidth: '140px', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.85rem' }}>{odp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{odp.dusun}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', color: isFull ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                          Port: {odp.used_ports || 0}/{odp.total_ports || 8}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Legend Overlay at Bottom Right */}
            <div style={{
              position: 'absolute', bottom: '10px', right: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(4px)',
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1',
              fontSize: '0.65rem', fontWeight: 700, color: '#334155',
              display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Port Tersedia
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} /> Port Penuh
              </span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Recent Tasks Feed */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#152C4A', margin: 0 }}>
                Tugas Terbaru
              </h3>
              <Link to="/admin/penugasan" style={{ fontSize: '0.7rem', color: '#2563EB', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span>Semua</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {latestTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0', fontSize: '0.75rem' }}>
                  Belum ada penugasan teknisi.
                </div>
              ) : (
                latestTasks.map((task) => {
                  const dateStr = task.created_at ? new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';
                  return (
                    <div key={task.id} style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: '#1E293B' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {task.customer_name || task.title || 'Pelanggan Umum'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} />
                          {dateStr}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <TypeBadge type={task.type || 'Maintenance'} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
            {latestTasks.length} tugas aktif
          </div>
        </div>

      </div>

      {/* Lower Grid: Monthly Chart & Latest Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Monthly Trend Chart */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#152C4A', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <TrendingUp size={15} color="#2563EB" />
              <span>Grafik Tren Bulanan</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#2563EB' }} /> Pasang Baru
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#F59E0B' }} /> Gangguan
              </span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0px' }}>
              {monthlyChart.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>
                  Belum ada data transaksi bulanan.
                </div>
              ) : (() => {
                const maxVal = Math.max(5, ...monthlyChart.flatMap(m => [m.pasang || 0, m.gangguan || 0]));
                return monthlyChart.map((item, idx) => {
                  const pasangHeight = Math.min(100, ((item.pasang || 0) / maxVal) * 100);
                  const gangguanHeight = Math.min(100, ((item.gangguan || 0) / maxVal) * 100);

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '110px' }}>
                        <div 
                          style={{ height: `${Math.max(4, pasangHeight)}px`, width: '18px', backgroundColor: '#2563EB', borderRadius: '3px 3px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}
                        >
                          <span style={{ position: 'absolute', top: '-16px', fontSize: '0.65rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>
                            {item.pasang || 0}
                          </span>
                        </div>
                        <div 
                          style={{ height: `${Math.max(4, gangguanHeight)}px`, width: '18px', backgroundColor: '#F59E0B', borderRadius: '3px 3px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}
                        >
                          <span style={{ position: 'absolute', top: '-16px', fontSize: '0.65rem', fontWeight: 700, color: '#D97706', fontFamily: 'monospace' }}>
                            {item.gangguan || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Chart Month Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px', fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>
              {monthlyChart.map((item, idx) => (
                <span key={idx} style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace' }}>
                  {item.month}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Orders Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px' }}>
          <div>
            <div style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#152C4A', margin: 0 }}>
                Order Terbaru
              </h3>
              <Link to="/admin/order-pelanggan" style={{ fontSize: '0.7rem', color: '#2563EB', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span>Lihat Semua</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '450px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B', fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>NO. PESANAN</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>PELANGGAN</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>LAYANAN</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {latestOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0', fontSize: '0.75rem' }}>
                        Belum ada order masuk.
                      </td>
                    </tr>
                  ) : (
                    latestOrders.slice(0, 4).map((order, idx) => (
                      <tr 
                        key={order.id} 
                        onClick={() => navigate(`/admin/order-pelanggan?id=${order.id}&ticket=${encodeURIComponent(order.order_number || '')}`)}
                        style={{ 
                          borderBottom: idx === 3 ? 'none' : '1px solid #F1F5F9', 
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE'}
                        title={`Buka detail order ${order.order_number || order.customer_name}`}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                          {order.order_number || `ORD-00${order.id}`}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          <span style={{ textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                            {order.customer_name}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <TypeBadge type={order.type || 'Pasang Baru'} />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center', padding: '8px', borderTop: '1px solid #F1F5F9' }}>
            {latestOrders.length} pesanan tercatat
          </div>
        </div>

      </div>

    </div>
  );
};
