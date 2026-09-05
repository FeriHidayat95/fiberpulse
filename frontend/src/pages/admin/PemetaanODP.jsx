import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Map as MapIcon, List, Wifi, AlertCircle, CheckCircle2, 
  RefreshCw, Plus, Eye, Edit, Trash2, Layers, MapPin, ChevronRight, ChevronLeft, Compass
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TambahOdpModal } from '../../components/TambahOdpModal';
import { EditOdpModal } from '../../components/EditOdpModal';
import { DetailOdpModal } from '../../components/DetailOdpModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { echo } from '../../utils/echo';

// Fix leaflet default icon missing issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enterprise SaaS WiFi Signal Marker Icon
const createWifiMarkerIcon = (status, usedPorts = 0, totalPorts = 8, isSelected = false) => {
  let color = '#10B981'; // Emerald Green (Available)
  let bg = '#ECFDF5';
  let border = '#059669';
  let glow = 'rgba(16, 185, 129, 0.35)';

  if (status === 'Penuh' || usedPorts >= totalPorts) {
    color = '#EF4444'; // Red
    bg = '#FEF2F2';
    border = '#DC2626';
    glow = 'rgba(239, 68, 68, 0.35)';
  } else if (status === 'Hampir Penuh' || usedPorts >= totalPorts - 2) {
    color = '#F59E0B'; // Amber
    bg = '#FFFBEB';
    border = '#D97706';
    glow = 'rgba(245, 158, 11, 0.35)';
  } else if (status === 'Rusak' || status === 'Maintenance') {
    color = '#8B5CF6'; // Purple
    bg = '#F5F3FF';
    border = '#7C3AED';
    glow = 'rgba(139, 92, 246, 0.35)';
  }

  const svgHtml = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <!-- Glowing Pulse Aura -->
      <div style="
        position: absolute; width: 44px; height: 44px; border-radius: 50%;
        background-color: ${glow};
        opacity: ${isSelected ? 0.9 : 0.45}; pointer-events: none;
      "></div>
      
      <!-- Enterprise Circular Glass Pin -->
      <div style="
        position: relative; width: 38px; height: 38px; border-radius: 50%;
        background: linear-gradient(135deg, #FFFFFF 0%, ${bg} 100%);
        border: 2.5px solid ${border};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18), 0 0 10px ${glow};
        cursor: pointer;
      ">
        <!-- Crisp Enterprise SaaS WiFi Signal SVG -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
        </svg>

        <!-- Port Badge Pill -->
        <span style="
          position: absolute; top: -5px; right: -5px;
          background-color: ${border}; color: #FFFFFF;
          padding: 0 4px; min-width: 17px; height: 17px; border-radius: 999px;
          font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
          border: 2px solid #FFFFFF; font-family: monospace; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${usedPorts}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-wifi-marker-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Enterprise Office / Headquarters Marker Icon
const createOfficeMarkerIcon = () => {
  const svgHtml = `
    <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
      <!-- Glowing Pulse Aura -->
      <div style="
        position: absolute; width: 48px; height: 48px; border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.35);
        pointer-events: none;
      "></div>
      
      <!-- Enterprise Circular Glass Pin -->
      <div style="
        position: relative; width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%);
        border: 2.5px solid #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), 0 0 12px rgba(37, 99, 235, 0.5);
        cursor: pointer;
      ">
        <!-- Crisp Enterprise Building / Office SVG Icon -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/>
          <path d="M16 6h.01"/>
          <path d="M12 6h.01"/>
          <path d="M12 10h.01"/>
          <path d="M12 14h.01"/>
          <path d="M16 10h.01"/>
          <path d="M16 14h.01"/>
          <path d="M8 10h.01"/>
          <path d="M8 14h.01"/>
        </svg>

        <!-- HQ Badge Pill -->
        <span style="
          position: absolute; top: -6px; right: -8px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF; padding: 1px 5px; border-radius: 999px;
          font-size: 0.58rem; font-weight: 900; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #FFFFFF; font-family: monospace; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          letter-spacing: 0.05em;
        ">HQ</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-office-marker-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

// Default Center: Kantor Pusat FiberPulse Technologies Inc. (Jl. Raya Keresek, Sumurgintung, Pagaden Barat, Subang)
export const DEFAULT_OPERATIONAL_CENTER = [-6.5045062, 107.7731963];
export const DEFAULT_OPERATIONAL_ZOOM = 16;

// Dynamic Map Auto Center & View Controller
function MapAutoFitController({ points, targetOdp, isSearchActive, resetTrigger }) {
  const map = useMap();
  const hasCenteredInitial = useRef(false);

  useEffect(() => {
    // Ensure ukuran peta selalu terhitung presisi saat dimount/tab dibuka
    map.invalidateSize();
    // Default: langsung arahkan ke area operasional perusahaan saat peta dibuka
    if (!hasCenteredInitial.current) {
      hasCenteredInitial.current = true;
      map.setView(DEFAULT_OPERATIONAL_CENTER, DEFAULT_OPERATIONAL_ZOOM);
    }
  }, [map]);

  useEffect(() => {
    // 1. Reset manual / tombol Pusatkan Area Operasional
    if (resetTrigger > 0) {
      map.flyTo(DEFAULT_OPERATIONAL_CENTER, DEFAULT_OPERATIONAL_ZOOM, { duration: 0.8 });
      return;
    }

    // 2. Jika ada ODP spesifik yang diklik/dipilih
    if (targetOdp && targetOdp.lat && targetOdp.lng) {
      map.flyTo([targetOdp.lat, targetOdp.lng], 17, { duration: 0.8 });
      return;
    }

    // 3. Hanya fit bounds jika user sedang aktif mencari / memfilter teks spesifik
    if (isSearchActive && points && points.length > 0) {
      const valid = points.filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);
      if (valid.length === 1) {
        map.flyTo([valid[0].lat, valid[0].lng], 16, { duration: 0.8 });
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 0.8 });
      }
    }
  }, [points, targetOdp, isSearchActive, resetTrigger, map]);

  return null;
}

export const PemetaanODP = () => {
  const [viewMode, setViewMode] = useState('Peta'); // 'Peta' or 'Daftar'
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOdp, setSelectedOdp] = useState(null);
  const [selectedDetailOdp, setSelectedDetailOdp] = useState(null);
  const [targetFlyOdp, setTargetFlyOdp] = useState(null);
  const [resetCenterKey, setResetCenterKey] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = echo.channel('odp-updates');
    channel.listen('.OdpUpdated', (e) => {
      queryClient.invalidateQueries({ queryKey: ['odps'] });
      toast.success('Peta diperbarui (Real-Time)', { id: 'odp-update' });
    });

    return () => {
      channel.stopListening('.OdpUpdated');
      echo.leaveChannel('odp-updates');
    };
  }, [queryClient]);

  const { data: odpPoints = [], isLoading: loading, refetch: fetchOdp } = useQuery({
    queryKey: ['odps'],
    queryFn: async () => {
      const res = await fetch('/api/odps?t=' + Date.now());
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        return json.data.map((item, idx) => {
          const used = item.used_ports || 0;
          const total = item.total_ports || 8;
          let st = 'Available';
          let clr = '#10B981'; // Emerald Green for Available
          let bgClr = '#ECFDF5';
          
          if (used >= total || item.status === 'Penuh') {
            st = 'Penuh';
            clr = '#EF4444';
            bgClr = '#FEF2F2';
          } else if (used >= total - 2) {
            st = 'Hampir Penuh';
            clr = '#F59E0B';
            bgClr = '#FFFBEB';
          }
          
          const lat = parseFloat(item.latitude) || DEFAULT_OPERATIONAL_CENTER[0];
          const lng = parseFloat(item.longitude) || DEFAULT_OPERATIONAL_CENTER[1];

          return {
            id: item.id || idx + 1,
            name: item.name,
            dusun: item.dusun || 'Dusun 1',
            status: st,
            terpakai: used,
            kapasitas: total,
            lat: lat,
            lng: lng,
            color: clr,
            bg: bgClr,
            raw: item
          };
        });
      }
      return [];
    },
    refetchInterval: 30000
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/odps/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menghapus ODP');
      return data;
    },
    onSuccess: () => {
      toast.success('ODP berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['odps'] });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus ODP ini? ODP yang dihapus tidak bisa dikembalikan.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (odpData) => {
    setSelectedOdp(odpData);
    setIsEditModalOpen(true);
  };

  const handleDetailClick = (odpData) => {
    setSelectedDetailOdp(odpData);
    setIsDetailModalOpen(true);
  };

  // Filters logic
  const filters = ['Semua', 'Available', 'Hampir Penuh', 'Penuh', 'Maintenance'];

  const filteredPoints = odpPoints.filter(point => {
    const matchesFilter = activeFilter === 'Semua' ? true : point.status === activeFilter;
    const matchesSearch = point.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          point.dusun.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination logic
  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(filteredPoints.length / itemsPerPage);
  const paginatedPoints = itemsPerPage === 'All' 
    ? filteredPoints 
    : filteredPoints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modals */}
      <TambahOdpModal 
        isOpen={isTambahModalOpen}
        onClose={() => setIsTambahModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['odps'] })}
      />

      <EditOdpModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['odps'] })}
        odpData={selectedOdp}
      />
      
      <DetailOdpModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        odpData={selectedDetailOdp}
        onOpenMap={(odp) => {
          setTargetFlyOdp({
            id: odp.id,
            lat: parseFloat(odp.latitude) || -6.49512,
            lng: parseFloat(odp.longitude) || 107.75034
          });
          setViewMode('Peta');
        }}
      />

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
            Pemetaan Titik ODP (GIS)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Monitoring sebaran titik ODP, koordinat GPS, dan kapasitas port fiber optik.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Secondary Refresh Button */}
          <button 
            onClick={fetchOdp} 
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
            onClick={() => setIsTambahModalOpen(true)}
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
            <span>Tambah ODP Baru</span>
          </button>

        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total ODP */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TOTAL ODP</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {odpPoints.length} Titik
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Tersebar di Seluruh Wilayah</p>
          </div>
        </div>

        {/* ODP Available */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>ODP TERSEDIA</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
              {odpPoints.filter(o => o.status === 'Available').length} Titik
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>Siap Pasang Baru</p>
          </div>
        </div>

        {/* ODP Full */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>ODP PENUH</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.02em' }}>
              {odpPoints.filter(o => o.status === 'Penuh').length} Titik
            </div>
            <p style={{ fontSize: '0.7rem', color: '#DC2626', margin: '3px 0 0 0', fontWeight: 500 }}>Semua Port Terisi</p>
          </div>
        </div>

        {/* Total Port Terpakai */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>PORT TERPAKAI</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {odpPoints.reduce((sum, o) => sum + (o.terpakai||0), 0)} / {odpPoints.reduce((sum, o) => sum + (o.kapasitas||0), 0)}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#1D4ED8', margin: '3px 0 0 0', fontWeight: 500 }}>Total Port FO Aktif</p>
          </div>
        </div>

      </div>

      {/* Toolbar Filters & Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Left: View Mode Toggle & Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', padding: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <button 
              onClick={() => setViewMode('Peta')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem',
                borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                background: viewMode === 'Peta' ? 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)' : 'transparent',
                color: viewMode === 'Peta' ? 'white' : '#64748B', transition: 'all 0.15s ease'
              }}
            >
              <MapIcon size={14} /> Peta GIS
            </button>
            <button 
              onClick={() => setViewMode('Daftar')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem',
                borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                background: viewMode === 'Daftar' ? 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)' : 'transparent',
                color: viewMode === 'Daftar' ? 'white' : '#64748B', transition: 'all 0.15s ease'
              }}
            >
              <List size={14} /> Tabel Daftar
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {filters.map(filter => {
              const isActive = activeFilter === filter;
              let bg = '#FFFFFF';
              let text = '#64748B';
              let border = '#E2E8F0';

              if (isActive) {
                if (filter === 'Semua') { bg = '#152C4A'; text = '#FFFFFF'; border = '#152C4A'; }
                else if (filter === 'Available') { bg = '#ECFDF5'; text = '#059669'; border = '#10B981'; }
                else if (filter === 'Hampir Penuh') { bg = '#FFFBEB'; text = '#D97706'; border = '#F59E0B'; }
                else if (filter === 'Penuh') { bg = '#FEF2F2'; text = '#DC2626'; border = '#EF4444'; }
                else if (filter === 'Maintenance') { bg = '#EFF6FF'; text = '#2563EB'; border = '#3B82F6'; }
              }

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                    border: `1px solid ${border}`,
                    backgroundColor: bg, color: text,
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Search Input */}
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Cari nama ODP atau dusun..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
              backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
            }}
          />
        </div>

      </div>

      {/* Main View: Peta or Daftar */}
      {viewMode === 'Peta' ? (
        <div style={{
          position: 'relative', height: '580px', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', backgroundColor: '#FFFFFF',
          isolation: 'isolate', zIndex: 1
        }}>
          
          <MapContainer 
            center={DEFAULT_OPERATIONAL_CENTER} 
            zoom={DEFAULT_OPERATIONAL_ZOOM} 
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dynamic Map Auto Center & View Controller */}
            <MapAutoFitController 
              points={filteredPoints} 
              targetOdp={targetFlyOdp} 
              isSearchActive={searchQuery.trim().length > 0} 
              resetTrigger={resetCenterKey} 
            />

            {/* Headquarters / Kantor Pusat Operational Marker */}
            <Marker 
              position={DEFAULT_OPERATIONAL_CENTER} 
              icon={createOfficeMarkerIcon()}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '190px', padding: '6px', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                    🏢 KANTOR PUSAT OPERASIONAL
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 800, color: '#152C4A' }}>FiberPulse Technologies Inc.</h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#64748B', lineHeight: '1.3' }}>Jl. Raya Keresek, RT.31/RW.08, Sumurgintung, Kec. Pagaden Bar., Kab. Subang, Jawa Barat 41252</p>
                  
                  <div style={{ padding: '5px 8px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.68rem', color: '#475569', marginBottom: '8px', fontFamily: 'monospace' }}>
                    GPS: -6.5045062, 107.7731963
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=-6.50450621873912,107.77319627943892`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      padding: '5px 10px', borderRadius: '6px', backgroundColor: '#2563EB',
                      color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', width: '100%', boxSizing: 'border-box'
                    }}
                  >
                    Petunjuk Arah (Maps)
                  </a>
                </div>
              </Popup>
            </Marker>

            {filteredPoints.map(point => {
              const isSelected = targetFlyOdp && targetFlyOdp.id === point.id;
              const icon = createWifiMarkerIcon(point.status, point.terpakai, point.kapasitas, isSelected);

              return (
                <Marker 
                  key={point.id} 
                  position={[point.lat, point.lng]} 
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setTargetFlyOdp(point);
                    }
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: 'center', minWidth: '160px', padding: '4px', fontFamily: 'Inter, sans-serif' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px', backgroundColor: point.bg, color: point.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                        <Wifi size={11} /> {point.status}
                      </div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 800, color: '#152C4A' }}>{point.name}</h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{point.dusun}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748B' }}>Kapasitas:</span>
                        <span style={{ fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>{point.kapasitas} Port</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748B' }}>Terpakai:</span>
                        <span style={{ fontWeight: 800, color: point.color, fontFamily: 'monospace' }}>{point.terpakai} Port</span>
                      </div>

                      <button
                        onClick={() => handleDetailClick(point.raw)}
                        style={{
                          width: '100%', padding: '6px 12px', borderRadius: '6px',
                          backgroundColor: '#152C4A', color: '#FFFFFF',
                          border: 'none', fontSize: '0.7rem', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <Eye size={12} /> Buka Detail Port
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Tombol Floating: Pusatkan ke Area Operasional Perusahaan */}
          <button
            type="button"
            onClick={() => {
              setTargetFlyOdp(null);
              setResetCenterKey(prev => prev + 1);
              toast.success('Peta dipusatkan ke Area Operasional Perusahaan', { id: 'center-op' });
            }}
            title="Pusatkan peta ke Area Operasional Perusahaan (Salagedang / Pagaden)"
            style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
              border: '1px solid #CBD5E1', borderRadius: '10px',
              padding: '7px 14px', fontSize: '0.75rem', fontWeight: 700,
              color: '#152C4A', display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#2563EB'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          >
            <Compass size={15} color="#2563EB" />
            <span>Pusatkan Area Operasional</span>
          </button>
          
          {/* Legend SaaS Enterprise */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '20px',
            backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            padding: '0.85rem 1rem', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column', gap: '7px', minWidth: '170px', zIndex: 1000
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#152C4A', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Wifi size={12} color="#2563EB" /> STATUS SINYAL &amp; ODP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              <span>Available (&lt;80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', boxShadow: '0 0 6px rgba(245,158,11,0.5)' }} />
              <span>Hampir Penuh (≥80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
              <span>Penuh (100%)</span>
            </div>
          </div>

        </div>
      ) : (
        /* List View Table */
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '850px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA ODP</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>LOKASI / DUSUN</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>PORT TERPAKAI</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>KAPASITAS</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPoints.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem' }}>
                      Tidak ada data ODP yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedPoints.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx === paginatedPoints.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Wifi size={13} color={item.color} />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{item.dusun}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{item.terpakai} Port</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{item.kapasitas} Port</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                          backgroundColor: item.bg, color: item.color, whiteSpace: 'nowrap'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={() => {
                              setTargetFlyOdp(item);
                              setViewMode('Peta');
                            }}
                            title="Fokuskan Titik Ini di Peta GIS"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              backgroundColor: '#EFF6FF', color: '#2563EB',
                              border: '1px solid #BFDBFE', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <MapPin size={12} /> Buka di Peta
                          </button>
                          <button 
                            onClick={() => handleDetailClick(item.raw)}
                            title="Lihat Detail & Grid Port ODP"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              backgroundColor: '#F1F5F9', color: '#334155',
                              border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                          <button 
                            onClick={() => handleEditClick(item.raw)}
                            title="Edit Data ODP"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              backgroundColor: '#FFFBEB', color: '#D97706',
                              border: '1px solid #FDE68A', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            title="Hapus ODP"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              backgroundColor: '#FEF2F2', color: '#DC2626',
                              border: '1px solid #FECACA', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Tampilkan:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: 600, color: '#152C4A' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="All">Semua</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>
                Halaman {currentPage} dari {itemsPerPage === 'All' ? 1 : totalPages || 1}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || itemsPerPage === 'All'}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={12} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0 || itemsPerPage === 'All'}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
