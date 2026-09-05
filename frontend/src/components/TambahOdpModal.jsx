import React, { useState } from 'react';
import { X, MapPin, Save, Wifi, Loader2, Server, Crosshair, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import toast from 'react-hot-toast';

export const TambahOdpModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    dusun: '',
    total_ports: 8,
    latitude: '',
    longitude: ''
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleGps = (e) => {
    const checked = e.target.checked;
    setUseCurrentLocation(checked);
    if (checked) {
      if (!navigator.geolocation) {
        setFormData(prev => ({ ...prev, latitude: '-6.5045062', longitude: '107.7731963' }));
        toast('Koordinat default Kantor Subang diterapkan.');
        return;
      }
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(7),
            longitude: pos.coords.longitude.toFixed(7)
          }));
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setIsGettingLocation(false);
          toast.success(`Lokasi GPS terkunci (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
        },
        (err) => {
          setIsGettingLocation(false);
          setFormData(prev => ({
            ...prev,
            latitude: prev.latitude || '-6.5045062',
            longitude: prev.longitude || '107.7731963'
          }));
          setGpsAccuracy('Subang (Area)');
          toast('Izin GPS browser belum aktif. Koordinat otomatis diset ke area Subang.', { duration: 4000 });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama / Kode ODP wajib diisi!");
      return;
    }
    if (!formData.dusun.trim()) {
      toast.error("Wilayah / Dusun wajib diisi!");
      return;
    }
    if (!String(formData.latitude || '').trim()) {
      toast.error("Field Latitude wajib diisi!");
      return;
    }
    if (!String(formData.longitude || '').trim()) {
      toast.error("Field Longitude wajib diisi!");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/odps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        })
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menambahkan ODP');
      }

      toast.success(`ODP ${formData.name} berhasil ditambahkan!`);
      setFormData({ name: '', dusun: '', total_ports: 8, latitude: '', longitude: '' });
      setUseCurrentLocation(false);
      setGpsAccuracy(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan ODP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Server size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>Tambah ODP Baru</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Registrasi titik Optical Distribution Point ke pemetaan</p>
      </div>
    </div>
  );

  const customFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>* Field wajib diisi</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onClose}
          disabled={isSubmitting}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button 
          type="submit" 
          form="tambahOdpForm"
          disabled={isSubmitting}
          className="sgt-btn-primary"
          style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan ODP</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={customFooter} maxWidth="480px">
      <form id="tambahOdpForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Nama / Kode ODP <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input 
            type="text" 
            required 
            placeholder="Contoh: ODP-SLG-03 / SALAGEDANG - 03" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 700, boxSizing: 'border-box' }}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Wilayah / Dusun <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text" 
              required 
              placeholder="Contoh: Dusun 1 Salagedang / RT 04 RW 02" 
              value={formData.dusun}
              onChange={e => setFormData({...formData, dusun: e.target.value})}
              style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Kapasitas Port
            </label>
            <select 
              value={formData.total_ports} 
              onChange={e => setFormData({...formData, total_ports: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', backgroundColor: 'white', fontWeight: 600, fontFamily: 'monospace' }}
            >
              <option value={4}>4 Port (Splitter 1:4)</option>
              <option value={8}>8 Port (Splitter 1:8)</option>
              <option value={16}>16 Port (Splitter 1:16)</option>
            </select>
          </div>
        </div>

        {/* Checkbox Kotak Pilihan Gunakan Lokasi Saat Ini */}
        <div style={{
          backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
          padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', margin: 0 }}>
            <input 
              type="checkbox" 
              checked={useCurrentLocation} 
              onChange={handleToggleGps}
              style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Crosshair size={14} color="#2563EB" /> Gunakan Lokasi Saat Ini (GPS Otomatis)
            </span>
          </label>
          {isGettingLocation && (
            <span style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={12} className="animate-spin" /> Mengunci GPS...
            </span>
          )}
          {!isGettingLocation && gpsAccuracy && (
            <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
              ±{gpsAccuracy}m
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Latitude GPS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Contoh: -6.5045062" 
              value={formData.latitude}
              onChange={e => setFormData({...formData, latitude: e.target.value})}
              style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Longitude GPS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Contoh: 107.7731963" 
              value={formData.longitude}
              onChange={e => setFormData({...formData, longitude: e.target.value})}
              style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
