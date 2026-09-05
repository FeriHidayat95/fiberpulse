import React, { useState } from 'react';
import { X, ChevronDown, Loader2, Camera, QrCode, Trash2, Layers, AlertTriangle } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import toast from 'react-hot-toast';

export const TambahAsetModal = ({ isOpen, onClose, onSave }) => {
  const [namaAset, setNamaAset] = useState('');
  const [merkAset, setMerkAset] = useState('');
  const [tipeAset, setTipeAset] = useState('Serial'); // 'Serial' | 'Non-Serial'
  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().split('T')[0]);
  
  // Serial specific fields
  const [serialNumber, setSerialNumber] = useState('');
  const [serialNumbersList, setSerialNumbersList] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [tahunPembuatan, setTahunPembuatan] = useState(new Date().getFullYear().toString());
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Non-Serial specific fields
  const [jumlahStok, setJumlahStok] = useState('');
  const [satuan, setSatuan] = useState('Meter');

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleBatchScan = (scannedList) => {
    const combined = [...serialNumbersList];
    let newCount = 0;
    scannedList.forEach((sn) => {
      const clean = sn.trim();
      if (clean && !combined.includes(clean)) {
        combined.push(clean);
        newCount++;
      }
    });
    setSerialNumbersList(combined);
    if (combined.length > 0 && !serialNumber) {
      setSerialNumber(combined[0]);
    }
    if (newCount > 0) {
      toast.success(`${newCount} Serial Number berhasil di-scan.`);
    }
  };

  const handleSimpan = async () => {
    if (!namaAset.trim()) {
      toast.error('Mohon lengkapi Nama Aset!');
      return;
    }
    if (!merkAset.trim()) {
      toast.error('Mohon lengkapi Merk Aset!');
      return;
    }
    if (!tanggalMasuk) {
      toast.error('Mohon tentukan Tanggal Masuk!');
      return;
    }

    let allSerials = [...serialNumbersList];
    if (serialNumber.trim() && !allSerials.includes(serialNumber.trim())) {
      allSerials.push(serialNumber.trim());
    }

    if (tipeAset === 'Serial') {
      if (allSerials.length === 0) {
        toast.error('Mohon masukkan atau scan minimal 1 Serial Number (SN)!');
        return;
      }
    } else {
      if (!jumlahStok || isNaN(Number(jumlahStok)) || Number(jumlahStok) <= 0) {
        toast.error('Mohon masukkan Jumlah Stok yang valid (minimal 1)!');
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name: namaAset.trim(),
        category: tipeAset,
        brand: merkAset.trim(),
        stock_type: tipeAset === 'Serial' ? 'Unit' : (satuan.trim() || 'Meter'),
        total_stock: tipeAset === 'Serial' ? allSerials.length : Number(jumlahStok),
        serial_numbers: tipeAset === 'Serial' ? allSerials : null,
        year: tipeAset === 'Serial' && tahunPembuatan.trim() ? tahunPembuatan.trim() : null,
        notes: tipeAset === 'Serial' && tahunPembuatan.trim() ? `Tahun Pembuatan: ${tahunPembuatan.trim()}` : null,
        created_at: tanggalMasuk
      };

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && !data.success)) {
        toast.error(data?.message || 'Gagal mendaftarkan aset');
        setSaving(false);
        return;
      }

      toast.success(data?.message || `Aset "${namaAset}" berhasil didaftarkan ke sistem!`);

      if (onSave) {
        onSave(data?.data);
      }

      // Reset form
      setNamaAset('');
      setMerkAset('');
      setSerialNumber('');
      setTahunPembuatan(new Date().getFullYear().toString());
      setJumlahStok('');
      setSatuan('Meter');
      onClose();
    } catch (e) {
      console.error('Error TambahAsetModal:', e);
      toast.error(`Terjadi kesalahan koneksi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: '#152C4A',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease'
  };

  const cardInputStyle = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: '#152C4A',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 20px 30px -10px rgba(21, 44, 74, 0.2)',
          border: '1px solid #E2EBF4',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          boxSizing: 'border-box'
        }}
      >
        {/* Header Modal */}
        <div style={{
          padding: '1rem 1.4rem',
          borderBottom: '1px solid #E2EBF4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '4px', height: '18px', backgroundColor: '#2563EB', borderRadius: '99px', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
              Tambah Aset
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#152C4A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem', backgroundColor: '#FFFFFF' }}>
          
          {/* Section: Data Umum */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#152C4A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              DATA UMUM
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              
              {/* Nama Aset */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                  Nama Aset <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: ONT ZTE F670L"
                  value={namaAset}
                  onChange={(e) => setNamaAset(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Merk Aset */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                  Merk Aset <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: ZTE"
                  value={merkAset}
                  onChange={(e) => setMerkAset(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Tipe Aset */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                  Tipe Aset <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={tipeAset}
                    onChange={(e) => setTipeAset(e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      paddingRight: '32px'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="Serial">Serial</option>
                    <option value="Consumable">Consumable</option>
                  </select>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>

              {/* Tanggal Masuk */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                  Tanggal Masuk <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

            </div>
          </div>

          {/* Section: Dynamic Detail Card */}
          <div style={{
            borderRadius: '10px',
            border: '1px solid #E2EBF4',
            backgroundColor: '#F8FAFC',
            padding: '0.95rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '3px', height: '13px', backgroundColor: '#2563EB', borderRadius: '99px', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#152C4A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  DETAIL ASET — {tipeAset.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {tipeAset}
                </span>
                <span style={{ width: '18px', height: '18px', borderRadius: '99px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  -
                </span>
              </div>
            </div>

            {/* Serial Dynamic Fields */}
            {tipeAset === 'Serial' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>
                      Serial Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      title="Scan Barcode / QR Kamera"
                      style={{
                        background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB',
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Camera size={12} /> Scan Kamera
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text"
                      placeholder="Serial Number (atau Scan)"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      style={{ ...cardInputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flex: 1 }}
                      onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      title="Buka Kamera Barcode"
                      style={{
                        padding: '0 10px', backgroundColor: '#2563EB', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                    Tahun Pembuatan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Tahun"
                    value={tahunPembuatan}
                    onChange={(e) => setTahunPembuatan(e.target.value)}
                    style={{ ...cardInputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                    onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                </div>

                {serialNumbersList.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem', backgroundColor: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} color="#2563EB" /> Serial Ter-scan: <strong style={{ color: '#2563EB' }}>{serialNumbersList.length} Unit</strong>
                      </span>
                      <button 
                        type="button"
                        onClick={() => setIsConfirmClearOpen(true)}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.15s ease' }}
                        title="Bersihkan seluruh daftar Serial Number yang telah di-scan"
                      >
                        <Trash2 size={10} /> Bersihkan Semua
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '60px', overflowY: 'auto' }}>
                      {serialNumbersList.map((sn, idx) => (
                        <span key={idx} style={{ backgroundColor: 'white', border: '1px solid #CBD5E1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          {sn}
                          <button type="button" onClick={() => setSerialNumbersList(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Non-Serial Dynamic Fields */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                    Jumlah Stok <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={jumlahStok}
                    onChange={(e) => setJumlahStok(e.target.value)}
                    style={{ ...cardInputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                    onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                    Satuan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Meter / Pcs / Roll"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    style={cardInputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Modal per DESIGN.md (Signature Gradient Button) */}
        <div style={{
          padding: '0.85rem 1.4rem',
          borderTop: '1px solid #E2EBF4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          backgroundColor: '#FFFFFF'
        }}>
          <button 
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          >
            Batal
          </button>
          
          <button 
            type="button"
            onClick={handleSimpan}
            disabled={saving}
            className="sgt-btn-primary"
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan</span>
            )}
          </button>
        </div>

      </div>

      {showScanner && (
        <BarcodeScanner 
          multiScan={true}
          initialItems={serialNumbersList}
          onScan={(sn) => {
            setSerialNumber(sn);
            handleBatchScan([sn]);
          }}
          onBatchScan={handleBatchScan}
          onClose={() => setShowScanner(false)}
          onManual={(sn) => {
            setSerialNumber(sn);
            handleBatchScan([sn]);
            setShowScanner(false);
          }}
          title="Scan Serial Number Aset"
        />
      )}

      {/* Modal Alert Konfirmasi Bersihkan Semua Serial */}
      {isConfirmClearOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #E2E8F0',
            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#DC2626', flexShrink: 0
              }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#152C4A' }}>
                  Konfirmasi Bersihkan Serial Number
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                  Apakah Anda yakin ingin menghapus/mengosongkan seluruh daftar <strong>{serialNumbersList.length} Serial Number</strong> yang telah diinput/di-scan?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSerialNumbersList([]);
                  setIsConfirmClearOpen(false);
                  toast.success('Daftar Serial Number berhasil dibersihkan.');
                }}
                style={{
                  padding: '6px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)'
                }}
              >
                <Trash2 size={12} />
                <span>Ya, Bersihkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
