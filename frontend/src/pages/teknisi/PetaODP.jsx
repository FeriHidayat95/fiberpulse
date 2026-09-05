import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search, MapPin, RefreshCw, AlertTriangle, Plus, Crosshair, X, Check, Navigation, Info, ShieldCheck, CheckCircle2, Server, Eye, Compass } from 'lucide-react';
import './PetaODP.css';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DetailOdpModal } from '../../components/DetailOdpModal';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// Fix leaflet default icon missing issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enterprise SaaS WiFi Signal Marker Icon
const createWifiMarkerIcon = (status, usedPorts = 0, isSelected = false) => {
  let color = '#10B981'; // Green for Available
  let bg = '#ECFDF5';
  let border = '#059669';
  let glow = 'rgba(16, 185, 129, 0.35)';

  if (status === 'Penuh') {
    color = '#EF4444'; // Red
    bg = '#FEF2F2';
    border = '#DC2626';
    glow = 'rgba(239, 68, 68, 0.35)';
  } else if (status === 'Hampir Penuh') {
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
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
      <!-- Glowing Pulse Effect if active/selected -->
      <div style="
        position: absolute; width: ${isSelected ? '48px' : '40px'}; height: ${isSelected ? '48px' : '40px'};
        border-radius: 50%; background-color: ${color}; opacity: ${isSelected ? '0.35' : '0.15'};
        ${isSelected ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
      "></div>
      
      <!-- Enterprise Circular Glass Pin -->
      <div style="
        position: relative; width: 34px; height: 34px; border-radius: 50%;
        background: linear-gradient(135deg, #FFFFFF 0%, ${bg} 100%);
        border: 2.2px solid ${border};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), 0 0 8px ${glow};
        cursor: pointer;
      ">
        <!-- Crisp Enterprise SaaS WiFi Signal SVG -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
        </svg>

        <!-- Port Badge Pill -->
        <span style="
          position: absolute; top: -5px; right: -5px;
          background-color: ${border}; color: #FFFFFF;
          padding: 0 3px; min-width: 15px; height: 15px; border-radius: 999px;
          font-size: 0.55rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #FFFFFF; font-family: monospace; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">${usedPorts}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-wifi-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Enterprise Office / Headquarters Marker Icon
const createOfficeMarkerIcon = () => {
  const svgHtml = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
      <!-- Glowing Pulse Effect -->
      <div style="
        position: absolute; width: 44px; height: 44px;
        border-radius: 50%; background-color: rgba(37, 99, 235, 0.35); pointer-events: none;
      "></div>
      
      <!-- Enterprise Circular Glass Pin -->
      <div style="
        position: relative; width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%);
        border: 2px solid #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25), 0 0 10px rgba(37, 99, 235, 0.5);
        cursor: pointer;
      ">
        <!-- Office Building SVG Icon -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
          position: absolute; top: -5px; right: -7px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF; padding: 1px 4px; border-radius: 999px;
          font-size: 0.55rem; font-weight: 900; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #FFFFFF; font-family: monospace; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">HQ</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-office-marker-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
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
    map.invalidateSize();
    if (!hasCenteredInitial.current) {
      hasCenteredInitial.current = true;
      map.setView(DEFAULT_OPERATIONAL_CENTER, DEFAULT_OPERATIONAL_ZOOM);
    }
  }, [map]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo(DEFAULT_OPERATIONAL_CENTER, DEFAULT_OPERATIONAL_ZOOM, { duration: 0.8 });
      return;
    }

    if (targetOdp && targetOdp.lat && targetOdp.lng) {
      map.flyTo([targetOdp.lat, targetOdp.lng], 17, { duration: 1.0 });
      return;
    }

    if (isSearchActive && points && points.length > 0) {
      const valid = points.filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);
      if (valid.length === 1) {
        map.flyTo([valid[0].lat, valid[0].lng], 16, { duration: 0.8 });
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, duration: 0.8 });
      }
    }
  }, [points, targetOdp, isSearchActive, resetTrigger, map]);

  return null;
}

// Component to handle map clicks & marker dragging in modal
function LocationPickerMarker({ position, setPosition, onLocationSelected }) {
  const map = useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onLocationSelected) onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position && map) {
      map.flyTo(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          const newPos = [pos.lat, pos.lng];
          setPosition(newPos);
          if (onLocationSelected) onLocationSelected(pos.lat, pos.lng);
        },
      }}
    />
  );
}

export const PetaODP = () => {
  const [activeTab, setActiveTab] = useState("Semua");
  const [odpList, setOdpList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOdp, setSelectedOdp] = useState(null);
  const [targetFlyOdp, setTargetFlyOdp] = useState(null);
  
  // Search & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Adding ODP
  const [formData, setFormData] = useState({
    name: '',
    dusun: 'DESA JATI',
    customDusun: '',
    total_ports: 16,
    used_ports: 0,
    status: 'Available',
    address: '',
    description: '',
    latitude: DEFAULT_OPERATIONAL_CENTER[0],
    longitude: DEFAULT_OPERATIONAL_CENTER[1],
  });

  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [pickerPosition, setPickerPosition] = useState(DEFAULT_OPERATIONAL_CENTER);
  const [resetCenterKey, setResetCenterKey] = useState(0);

  useDocumentTitle('Peta ODP (GIS) — FiberPulse');

  const dynamicDusunList = ["Semua", ...new Set(odpList.map(d => d.dusun).filter(Boolean))].sort();

  const fetchOdpData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/odps');
      const res = await response.json();
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map((item, idx) => {
          const used = item.used_ports || 0;
          const total = item.total_ports || 16;
          let st = item.status || 'Available';
          if (used >= total || st === 'Penuh') { st = 'Penuh'; }
          else if (used >= total - 2) { st = 'Hampir Penuh'; }

          return {
            id: item.id || idx + 1,
            name: item.name,
            dusun: item.dusun || 'DESA JATI',
            status: st,
            used_ports: used,
            total_ports: total,
            ports: `${used}/${total} Port Terisi`,
            lat: parseFloat(item.latitude) || DEFAULT_OPERATIONAL_CENTER[0],
            lng: parseFloat(item.longitude) || DEFAULT_OPERATIONAL_CENTER[1],
            address: item.address || '',
            description: item.description || '',
          };
        });
        setOdpList(mapped);
      }
    } catch (error) {
      console.log('Error fetching live ODPs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdpData();
  }, []);

  // Open Add ODP Modal & Pre-generate code
  const handleOpenAddModal = () => {
    const nextNumber = odpList.length + 1;
    const autoName = `ODP-JATI-${String(nextNumber).padStart(2, '0')}`;
    
    setFormData({
      name: autoName,
      dusun: dynamicDusunList.find(d => d !== 'Semua') || 'DESA JATI',
      customDusun: '',
      total_ports: 16,
      used_ports: 0,
      status: 'Available',
      address: '',
      description: '',
      latitude: DEFAULT_OPERATIONAL_CENTER[0],
      longitude: DEFAULT_OPERATIONAL_CENTER[1],
    });
    setPickerPosition(DEFAULT_OPERATIONAL_CENTER);
    setGpsAccuracy(null);
    setIsAddModalOpen(true);

    handleCaptureGPS();
  };

  // High Accuracy GPS Auto-Capture & Reverse Geocoding
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Browser atau perangkat Anda tidak mendukung fitur GPS');
      return;
    }

    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setPickerPosition([lat, lng]);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setGpsAccuracy(accuracy);
        setFetchingGps(false);
        toast.success(`Lokasi GPS berhasil dikunci (Akurasi: ±${accuracy}m)`);

        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && revData.address) {
              const road = revData.address.road || revData.address.suburb || '';
              const village = revData.address.village || revData.address.suburb || revData.address.neighbourhood || '';
              const district = revData.address.city_district || revData.address.town || revData.address.county || '';
              const fullAddr = [road, village ? `Desa ${village}` : '', district ? `Kec. ${district}` : ''].filter(Boolean).join(', ');
              
              if (fullAddr) {
                setFormData(prev => ({
                  ...prev,
                  address: prev.address || fullAddr,
                }));
              }
            }
          }
        } catch (e) {
          console.log('Reverse geocoding fallback:', e);
        }
      },
      (err) => {
        setFetchingGps(false);
        console.warn('Geolocation error:', err);
        toast.error('Gagal mengambil lokasi GPS. Tentukan titik dengan tap pin di peta.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Submit ODP Data
  const handleSaveODP = async (e) => {
    e.preventDefault();
    
    const finalDusun = formData.dusun === 'LAINNYA' ? formData.customDusun : formData.dusun;

    if (!formData.name.trim()) {
      toast.error('Mohon isi Nama/Kode ODP!');
      return;
    }
    if (!finalDusun.trim()) {
      toast.error('Mohon tentukan Wilayah/Dusun ODP!');
      return;
    }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      toast.error('Field Latitude wajib diisi!');
      return;
    }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      toast.error('Field Longitude wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        dusun: finalDusun.trim(),
        total_ports: parseInt(formData.total_ports) || 16,
        used_ports: parseInt(formData.used_ports) || 0,
        status: formData.status,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address.trim(),
        description: formData.description.trim(),
      };

      const res = await fetch('/api/odps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`ODP Baru "${formData.name}" berhasil ditambahkan!`);
        setIsAddModalOpen(false);
        fetchOdpData();
      } else {
        const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Gagal menyimpan ODP');
        toast.error(`Gagal: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Save ODP error:', err);
      toast.error('Terjadi kesalahan koneksi saat menyimpan ODP.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredODP = odpList.filter(d => {
    const matchesTab = activeTab === "Semua" ? true : d.dusun === activeTab;
    const matchesSearch = searchQuery.trim() === '' ? true : (
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.dusun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.address && d.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesTab && matchesSearch;
  });

  return (
    <div className="tk-main-content">
      
      {/* Hero Operations Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1rem 1.15rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
              Peta ODP Lapangan
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              GIS &amp; Pemetaan Titik ODP Lapangan FiberPulse Technologies Inc..
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              onClick={handleOpenAddModal}
              className="sgt-btn-primary"
              style={{
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Plus size={14} />
              <span>Tambah ODP</span>
            </button>

            <button 
              onClick={fetchOdpData}
              disabled={loading}
              title="Refresh Data Live"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#152C4A',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            <button 
              onClick={() => setShowSearchModal(true)}
              title="Cari ODP"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#152C4A',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Search size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tk-filter-scroll">
        {dynamicDusunList.map(tab => (
          <button 
            key={tab} 
            className={`tk-filter-pill ${activeTab === tab ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Real Map Area */}
      <div style={{ position: 'relative', height: '340px', zIndex: 1, isolation: 'isolate', marginBottom: '1.25rem', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <MapContainer center={DEFAULT_OPERATIONAL_CENTER} zoom={DEFAULT_OPERATIONAL_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {/* Dynamic Map Auto Center & View Controller */}
          <MapAutoFitController 
            points={filteredODP} 
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
              <div style={{ textAlign: 'center', padding: '6px', minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                  🏢 KANTOR OPERASIONAL
                </div>
                <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.85rem', marginBottom: '3px' }}>FiberPulse Technologies Inc.</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: '1.3', marginBottom: '8px' }}>Jl. Raya Keresek, RT.31/RW.08, Sumurgintung, Kec. Pagaden Bar., Kab. Subang, Jawa Barat 41252</div>
                
                <div style={{ padding: '4px 6px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.68rem', color: '#475569', marginBottom: '8px', fontFamily: 'monospace' }}>
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

          {filteredODP.map(point => {
            const isSelected = targetFlyOdp && targetFlyOdp.id === point.id;
            return (
              <Marker 
                key={point.id} 
                position={[point.lat, point.lng]}
                icon={createWifiMarkerIcon(point.status, point.used_ports, isSelected)}
                eventHandlers={{
                  click: () => {
                    setTargetFlyOdp(point);
                  }
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px', minWidth: '150px' }}>
                    <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.9rem', marginBottom: '2px', fontFamily: 'monospace' }}>{point.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '6px' }}>{point.dusun}</div>
                    <div style={{ marginBottom: '6px' }}><StatusBadge status={point.status} /></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>{point.ports}</div>
                    {point.address && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>{point.address}</div>}
                    <button 
                      onClick={() => setSelectedOdp(point)}
                      style={{ marginTop: '8px', background: '#2563EB', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}
                    >
                      Detail Lengkap
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
            toast.success('Peta dipusatkan ke Area Operasional Perusahaan', { id: 'center-op-tk' });
          }}
          title="Pusatkan peta ke Area Operasional Perusahaan"
          style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
            border: '1px solid #CBD5E1', borderRadius: '8px',
            padding: '5px 10px', fontSize: '0.7rem', fontWeight: 700,
            color: '#152C4A', display: 'flex', alignItems: 'center', gap: '5px',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}
        >
          <Compass size={13} color="#2563EB" />
          <span>Area Operasional</span>
        </button>
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '5px', zIndex: 400, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <MapPin size={12} color="#2563EB" />
          <span>{filteredODP.length} ODP Terdeteksi di Peta</span>
        </div>
      </div>

      {/* ODP List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
            Daftar ODP {activeTab !== 'Semua' ? `— ${activeTab}` : ''}
          </h3>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
            Total: {filteredODP.length} ODP
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredODP.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <MapPin size={32} color="#94A3B8" style={{ margin: '0 auto 6px auto' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Tidak ada ODP ditemukan</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Coba ubah filter wilayah atau tambahkan ODP baru.</p>
            </div>
          ) : (
            filteredODP.map(odp => (
              <div key={odp.id} style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>{odp.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={12} color="#2563EB" /> {odp.dusun}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <StatusBadge status={odp.status} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color: odp.status === 'Penuh' || odp.status === 'Rusak' ? '#DC2626' : '#059669', background: odp.status === 'Penuh' || odp.status === 'Rusak' ? '#FEF2F2' : '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
                      {odp.ports}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      setTargetFlyOdp(odp);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="Fokuskan di Peta"
                    style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <MapPin size={12} /> Peta
                  </button>
                  <button 
                    onClick={() => setSelectedOdp(odp)}
                    style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Search ODP */}
      {showSearchModal && (
        <div className="tk-modal-backdrop">
          <div className="tk-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#152C4A' }}>Cari Titik ODP</h3>
                  <p style={{ margin: '1px 0 0 0', fontSize: '0.7rem', color: '#64748B' }}>Filter berdasarkan nama, dusun, atau alamat</p>
                </div>
              </div>
              <button className="tk-modal-close-btn" onClick={() => setShowSearchModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ margin: '0.75rem 0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text"
                  placeholder="Ketik Nama ODP, Dusun, atau Alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', color: '#152C4A' }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button 
                onClick={() => { setSearchQuery(''); setShowSearchModal(false); }}
                style={{ flex: 1, padding: '7px', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Reset
              </button>
              <button 
                onClick={() => setShowSearchModal(false)}
                className="sgt-btn-primary"
                style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ODP BARU */}
      {isAddModalOpen && (
        <div className="tk-modal-backdrop">
          <div className="tk-modal-box tk-add-odp-modal">
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#152C4A' }}>Tambah ODP Baru</h3>
                  <p style={{ margin: '1px 0 0 0', fontSize: '0.7rem', color: '#64748B' }}>Input titik ODP &amp; sinkronkan GIS ke server</p>
                </div>
              </div>
              <button className="tk-modal-close-btn" onClick={() => setIsAddModalOpen(false)}><X size={16} /></button>
            </div>

            {/* Warning Banner */}
            <div style={{ background: '#FFFBEB', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #FEF3C7', fontSize: '0.7rem', color: '#92400E', display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Peringatan Presisi:</strong> Pastikan titik koordinat diambil tepat di lokasi fisik tiang/ODP agar rute teknisi akurat.
              </div>
            </div>

            <form onSubmit={handleSaveODP}>
              {/* Auto GPS Location Button */}
              <div style={{ marginBottom: '0.75rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#152C4A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Crosshair size={13} color="#2563EB" /> Posisi GPS Presisi
                  </span>
                  {gpsAccuracy && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
                      Akurasi: ±{gpsAccuracy}m
                    </span>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={handleCaptureGPS}
                  disabled={fetchingGps}
                  style={{ width: '100%', padding: '6px 12px', background: '#FFFFFF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Navigation size={13} className={fetchingGps ? 'animate-spin' : ''} />
                  <span>{fetchingGps ? 'Mengunci Sinyal GPS...' : 'Kunci Titik GPS Saya Saat Ini'}</span>
                </button>
              </div>

              {/* Interactive Mini Map Picker */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ height: '140px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', position: 'relative' }}>
                  <MapContainer center={pickerPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPickerMarker 
                      position={pickerPosition} 
                      setPosition={setPickerPosition}
                      onLocationSelected={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng
                        }));
                      }}
                    />
                  </MapContainer>
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(15,23,42,0.85)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', zIndex: 1000 }}>
                    Lat: {Number(formData.latitude).toFixed(6)}, Lng: {Number(formData.longitude).toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Nama / Kode ODP <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="ODP-JATI-05"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Wilayah / Dusun <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Dusun 1 Salagedang / RT 04 RW 02"
                    value={formData.dusun}
                    onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontWeight: 600, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Kapasitas Total Port</label>
                  <select 
                    value={formData.total_ports}
                    onChange={(e) => setFormData({ ...formData, total_ports: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace' }}
                  >
                    <option value={8}>8 Port</option>
                    <option value={16}>16 Port</option>
                    <option value={24}>24 Port</option>
                    <option value={32}>32 Port</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Status Awal ODP</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A' }}
                  >
                    <option value="Available">Available (Tersedia)</option>
                    <option value="Hampir Penuh">Hampir Penuh</option>
                    <option value="Penuh">Penuh</option>
                    <option value="Maintenance">Maintenance / Rusak</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Patokan / Catatan Lokasi Lapangan</label>
                <textarea 
                  rows={2}
                  placeholder="Contoh: Tiang PLN no. 14 depan Warung Makan Ibu Hj. Nani"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '7px', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="sgt-btn-primary"
                  style={{ flex: 1.5, padding: '7px', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ODP Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail ODP Modal (Struktur Sama Persis dengan Modul Admin) */}
      <DetailOdpModal
        isOpen={!!selectedOdp}
        onClose={() => setSelectedOdp(null)}
        odpData={selectedOdp}
        onOpenMap={(odp) => {
          setTargetFlyOdp(odp);
          setSelectedOdp(null);
        }}
      />
    </div>
  );
};
