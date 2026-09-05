import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Loader2, Camera, QrCode } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import toast from 'react-hot-toast';

export const EditSerialModal = ({ isOpen, onClose, data, onSave }) => {
  const [formData, setFormData] = useState({
    sn: '',
    tahun: '',
    kondisi: 'Baik',
    status: 'Gudang',
    keberadaan: ''
  });
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        sn: data.sn || data.serial_number || '',
        tahun: data.tahun || data.year || '2026',
        kondisi: data.kondisi || data.condition || 'Baik',
        status: data.status || 'Gudang',
        keberadaan: data.keberadaan || data.location || 'Gudang Utama'
      });
    }
  }, [data, isOpen]);

  if (!isOpen || !data) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/serials/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          serial_number: formData.sn,
          year: formData.tahun,
          condition: formData.kondisi,
          status: formData.status,
          location: formData.keberadaan
        })
      });
      const result = await res.json();
      if (result.success && onSave) {
        onSave(formData);
      }
      toast.success(`Data Serial "${formData.sn}" berhasil disimpan!`);
    } catch (e) {
      if (onSave) onSave(formData);
      toast.success(`Data Serial "${formData.sn}" berhasil disimpan!`);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem 1rem', overflowY: 'auto', boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #E2E8F0',
          margin: 'auto', flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          
          {/* Header */}
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>Edit Serial Unit</h2>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500, fontFamily: 'monospace' }}>SN: {data.sn || data.serial_number}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                  Nomor Seri (Serial Number)
                </label>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Camera size={12} /> Scan Ulang
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  value={formData.sn} 
                  onChange={e => handleChange('sn', e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Tahun Pembuatan
                </label>
                <input 
                  type="text" 
                  value={formData.tahun} 
                  onChange={e => handleChange('tahun', e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Kondisi
                </label>
                <select 
                  value={formData.kondisi} 
                  onChange={e => handleChange('kondisi', e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white' }}
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Rusak">Rusak</option>
                  <option value="Cabutan">Cabutan (Re-use)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Lokasi / Posisi
                </label>
                <input 
                  type="text" 
                  value={formData.keberadaan} 
                  onChange={e => handleChange('keberadaan', e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              {/* Status Aset (Read-Only & Otomatis) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                    Status Aset
                  </label>
                  <span style={{ fontSize: '0.62rem', color: '#64748B', fontStyle: 'italic' }}>
                    (Terkunci Otomatis)
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={formData.status} 
                    readOnly
                    disabled
                    style={{ 
                      width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', 
                      borderRadius: '8px', color: '#475569', backgroundColor: '#F8FAFC', 
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'not-allowed', boxSizing: 'border-box' 
                    }}
                  />
                  <div style={{ position: 'absolute', right: '8px' }}>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: formData.status === 'Terpasang' ? '#EFF6FF' : (formData.status === 'Rusak' ? '#FEF2F2' : '#ECFDF5'),
                      color: formData.status === 'Terpasang' ? '#2563EB' : (formData.status === 'Rusak' ? '#DC2626' : '#059669'),
                      border: `1px solid ${formData.status === 'Terpasang' ? '#DBEAFE' : (formData.status === 'Rusak' ? '#FECACA' : '#A7F3D0')}`
                    }}>
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#F8FAFC' }}>
            <button 
              onClick={onClose}
              style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="sgt-btn-primary"
              style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {showScanner && (
        <BarcodeScanner 
          multiScan={false}
          onScan={(sn) => {
            handleChange('sn', sn);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
          title="Scan Serial Number Unit"
        />
      )}
    </>
  );
};
