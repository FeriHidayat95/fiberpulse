import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Tag, ShieldCheck, HardDrive, Wifi, Loader2, Edit3, CreditCard } from 'lucide-react';
import { Modal } from './ui/Modal';
import toast from 'react-hot-toast';

export const EditPelangganModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [packageSpeed, setPackageSpeed] = useState('30 Mbps');
  const [status, setStatus] = useState('Aktif');
  const [odpId, setOdpId] = useState('');
  const [odpPort, setOdpPort] = useState('');
  const [modemSn, setModemSn] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [odpList, setOdpList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || initialData.raw?.name || '');
      setNik(initialData.nik || initialData.raw?.nik || '');
      setPhone(initialData.phone || initialData.raw?.phone || '');
      setAddress(initialData.address || initialData.raw?.address || '');
      setPackageSpeed(initialData.package || initialData.raw?.package_speed || '30 Mbps');
      setStatus(initialData.status || initialData.raw?.status || 'Aktif');
      setOdpId(initialData.raw?.odp_id ? String(initialData.raw.odp_id) : '');
      setOdpPort(initialData.raw?.odp_port ? String(initialData.raw.odp_port) : (initialData.port ? initialData.port.replace(/[^0-9]/g, '') : ''));
      setModemSn(initialData.modem_sn || initialData.raw?.modem_sn || '');
      setLatitude(initialData.latitude || initialData.raw?.latitude ? String(initialData.latitude || initialData.raw?.latitude) : '');
      setLongitude(initialData.longitude || initialData.raw?.longitude ? String(initialData.longitude || initialData.raw?.longitude) : '');

      // Fetch ODP options
      fetch('/api/odps')
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            setOdpList(json.data);
          } else if (Array.isArray(json)) {
            setOdpList(json);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSimpan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name.trim()) {
      toast.error('Nama Pelanggan wajib diisi!');
      return;
    }
    if (!nik.trim()) {
      toast.error('Field NIK Pelanggan wajib diisi!');
      return;
    }
    if (!phone.trim()) {
      toast.error('Nomor Telepon / WhatsApp wajib diisi!');
      return;
    }
    if (!address.trim()) {
      toast.error('Alamat Lengkap wajib diisi!');
      return;
    }
    if (!String(latitude || '').trim()) {
      toast.error('Field Latitude wajib diisi!');
      return;
    }
    if (!String(longitude || '').trim()) {
      toast.error('Field Longitude wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        nik: nik.trim(),
        phone: phone.trim(),
        address: address.trim(),
        package: packageSpeed,
        package_speed: packageSpeed,
        status: status,
        odp_id: odpId ? Number(odpId) : null,
        odp_port: odpPort ? Number(odpPort) : null,
        modem_sn: modemSn.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      };

      const res = await fetch(`/api/customers/${initialData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);

      if (res.ok && (!json || json.success !== false)) {
        toast.success(json?.message || 'Data pelanggan berhasil diperbarui!');
        if (onSuccess) onSuccess();
        else onClose();
      } else {
        toast.error(json?.message || 'Gagal memperbarui data pelanggan');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      toast.error('Terjadi kesalahan jaringan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Edit3 size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
          Edit Data Pelanggan
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
          Perbarui identitas pelanggan, paket langganan, alokasi ODP, dan modem
        </p>
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>* Field wajib diisi</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onClose} 
          disabled={saving}
          style={{
            padding: '7px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Batal
        </button>
        <button 
          type="button" 
          onClick={handleSimpan} 
          disabled={saving}
          className="sgt-btn-primary"
          style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Perubahan</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={footer} maxWidth="600px">
      <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.25rem 0' }}>
        
        {/* Nama Lengkap & NIK Pelanggan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <User size={13} color="#2563EB" /> Nama Pelanggan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap pelanggan"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <CreditCard size={13} color="#2563EB" /> NIK Pelanggan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text"
              required
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="3204010101800007"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* No WhatsApp & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <Phone size={13} color="#059669" /> No. WhatsApp <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <ShieldCheck size={13} color="#2563EB" /> Status Berlangganan
            </label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Isolir">Isolir (Tunggakan)</option>
              <option value="Non-Aktif">Non-Aktif (Berhenti)</option>
            </select>
          </div>
        </div>

        {/* Alamat Lengkap */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            <MapPin size={13} color="#EA580C" /> Alamat Lengkap Instalasi <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea 
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Alamat rumah, RT/RW, Dusun..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
              border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
              fontWeight: 500, color: '#152C4A', resize: 'vertical', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Paket Kecepatan & Modem SN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <Wifi size={13} color="#7C3AED" /> Paket Kecepatan
            </label>
            <select 
              value={packageSpeed}
              onChange={(e) => setPackageSpeed(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
              }}
            >
              <option value="10 Mbps">10 Mbps</option>
              <option value="20 Mbps">20 Mbps</option>
              <option value="30 Mbps">30 Mbps</option>
              <option value="50 Mbps">50 Mbps</option>
              <option value="100 Mbps">100 Mbps</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <HardDrive size={13} color="#475569" /> SN Modem ONT
            </label>
            <input 
              type="text"
              value={modemSn}
              onChange={(e) => setModemSn(e.target.value)}
              placeholder="Contoh: ZTEGC1234567"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* ODP & Port Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <Tag size={13} color="#0284C7" /> Titik ODP Terhubung
            </label>
            <select 
              value={odpId}
              onChange={(e) => setOdpId(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
              }}
            >
              <option value="">-- Tanpa ODP / Belum Terkoneksi --</option>
              {odpList.map(odp => (
                <option key={odp.id} value={odp.id}>
                  {odp.name || `ODP #${odp.id}`} ({odp.used_ports || 0}/{odp.total_ports || 8} Port)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Nomor Port
            </label>
            <input 
              type="number"
              min="1"
              max="16"
              value={odpPort}
              onChange={(e) => setOdpPort(e.target.value)}
              placeholder="1"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Koordinat GPS Presisi (Latitude & Longitude) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <MapPin size={13} color="#2563EB" /> Latitude GPS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Contoh: -6.4952000"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <MapPin size={13} color="#2563EB" /> Longitude GPS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="text"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Contoh: 107.7505000"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.8rem',
                fontWeight: 600, color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};
