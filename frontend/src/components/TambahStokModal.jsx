import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronDown, Loader2, Camera, Plus, Trash2, Layers, AlertTriangle, Search, Check } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import toast from 'react-hot-toast';

export const TambahStokModal = ({ isOpen, onClose, onSave }) => {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAssetName, setSelectedAssetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().split('T')[0]);
  const [tipeAset, setTipeAset] = useState('Serial'); // 'Serial' | 'Non-Serial'

  // Serial specific fields
  const [serialNumber, setSerialNumber] = useState('');
  const [tahunPembuatan, setTahunPembuatan] = useState(new Date().getFullYear().toString());
  const [serialNumbersList, setSerialNumbersList] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Non-Serial specific fields
  const [jumlahStok, setJumlahStok] = useState('');
  const [satuan, setSatuan] = useState('Unit');

  const [availableAssets, setAvailableAssets] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/assets?t=' + Date.now())
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setAvailableAssets(json.data);
            if (json.data.length > 0 && !selectedAssetId) {
              const first = json.data[0];
              setSelectedAssetId(first.id);
              setSelectedAssetName(first.name);
              setSearchTerm(first.name);
              const isConsumable =
                first.category === 'Consumable' ||
                first.category === 'Non-Serial' ||
                String(first.stock_type).toLowerCase().includes('meter') ||
                String(first.stock_type).toLowerCase().includes('roll');
              setTipeAset(isConsumable ? 'Consumable' : 'Serial');
              setSatuan(first.stock_type || 'Unit');
            }
          }
        })
        .catch((e) => console.log('Offline fallback fetch assets', e));
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return availableAssets;
    const q = searchTerm.toLowerCase().trim();
    return availableAssets.filter((a) =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
      (a.stock_type && a.stock_type.toLowerCase().includes(q))
    );
  }, [availableAssets, searchTerm]);

  const selectAsset = (asset) => {
    setSelectedAssetId(asset.id);
    setSelectedAssetName(asset.name);
    setSearchTerm(asset.name);
    setIsDropdownOpen(false);

    const isConsumable =
      asset.category === 'Consumable' ||
      asset.category === 'Non-Serial' ||
      String(asset.stock_type).toLowerCase().includes('meter') ||
      String(asset.stock_type).toLowerCase().includes('roll');
    setTipeAset(isConsumable ? 'Consumable' : 'Serial');
    setSatuan(asset.stock_type || 'Unit');
  };

  if (!isOpen) return null;

  const handleAssetSelect = (e) => {
    const assetId = e.target.value;
    setSelectedAssetId(assetId);
    const found = availableAssets.find((a) => String(a.id) === String(assetId));
    if (found) {
      setSelectedAssetName(found.name);
      const isConsumable =
        found.category === 'Consumable' ||
        found.category === 'Non-Serial' ||
        String(found.stock_type).toLowerCase().includes('meter') ||
        String(found.stock_type).toLowerCase().includes('roll');
      setTipeAset(isConsumable ? 'Consumable' : 'Serial');
      setSatuan(found.stock_type || 'Unit');
    }
  };

  const handleAddSerialToList = () => {
    const clean = serialNumber.trim();
    if (!clean) return;
    if (serialNumbersList.includes(clean)) {
      toast.error(`Serial Number "${clean}" sudah ada dalam daftar.`);
      return;
    }
    setSerialNumbersList([...serialNumbersList, clean]);
    setSerialNumber('');
    toast.success(`SN "${clean}" ditambahkan.`);
  };

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
    if (newCount > 0) {
      toast.success(`${newCount} Serial Number berhasil di-scan.`);
    }
  };

  const handleRemoveSn = (index) => {
    setSerialNumbersList(serialNumbersList.filter((_, i) => i !== index));
  };

  const handleSimpanStok = async () => {
    if (!selectedAssetName) {
      toast.error('Mohon pilih Nama Aset terlebih dahulu!');
      return;
    }

    let allSerials = [...serialNumbersList];
    if (serialNumber.trim() && !allSerials.includes(serialNumber.trim())) {
      allSerials.push(serialNumber.trim());
    }

    let totalCalculated = 0;
    if (tipeAset === 'Serial') {
      if (allSerials.length === 0) {
        toast.error('Mohon masukkan minimal 1 Serial Number!');
        return;
      }
      totalCalculated = allSerials.length;
    } else {
      if (!jumlahStok || isNaN(Number(jumlahStok)) || Number(jumlahStok) <= 0) {
        toast.error('Mohon masukkan Jumlah Stok yang valid (minimal 1)!');
        return;
      }
      totalCalculated = Number(jumlahStok);
    }

    setSaving(true);

    try {
      const matched = availableAssets.find((a) => String(a.id) === String(selectedAssetId));
      const payload = {
        name: selectedAssetName,
        category: tipeAset,
        brand: matched?.brand || 'General',
        total_stock: totalCalculated,
        stock_type: tipeAset === 'Serial' ? 'Unit' : (satuan || 'Meter'),
        serial_numbers: tipeAset === 'Serial' ? allSerials : null,
        year: tipeAset === 'Serial' && tahunPembuatan ? tahunPembuatan.trim() : null,
        notes: tipeAset === 'Serial' && tahunPembuatan ? `Tahun Pembuatan: ${tahunPembuatan.trim()}` : null,
        created_at: tanggalMasuk
      };

      const res = await fetch('/api/assets/add-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && !data.success)) {
        toast.error(data?.message || 'Gagal menambahkan stok');
        setSaving(false);
        return;
      }

      toast.success(data?.message || `Stok "${selectedAssetName}" berhasil ditambahkan!`);

      if (onSave) {
        onSave(data?.data);
      }

      // Reset form
      setSerialNumber('');
      setSerialNumbersList([]);
      setJumlahStok('');
      onClose();
    } catch (e) {
      console.error('Error TambahStokModal:', e);
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
    <>
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
                Tambah Stok
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
            
            {/* Section: DATA UMUM */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#152C4A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                DATA UMUM
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Nama Aset (Searchable Autocomplete) */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>
                      Nama Aset <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 600 }}>
                      Ketik untuk mencari
                    </span>
                  </div>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Ketik untuk mencari nama aset..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      style={{
                        ...inputStyle,
                        paddingLeft: '32px',
                        paddingRight: searchTerm ? '54px' : '32px',
                        fontWeight: 600
                      }}
                      onFocusCapture={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                      onBlurCapture={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                    />
                    
                    <div style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedAssetId('');
                            setSelectedAssetName('');
                            setIsDropdownOpen(true);
                          }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94A3B8', padding: '2px', display: 'flex', alignItems: 'center'
                          }}
                          title="Hapus pencarian"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#64748B', padding: '2px', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <ChevronDown size={15} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      zIndex: 9999,
                      padding: '4px'
                    }}>
                      {filteredAssets.length === 0 ? (
                        <div style={{ padding: '12px 14px', textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Tidak ada aset yang cocok dengan "{searchTerm}"
                        </div>
                      ) : (
                        filteredAssets.map((asset) => {
                          const isSelected = String(asset.id) === String(selectedAssetId);
                          const isConsumable =
                            asset.category === 'Consumable' ||
                            asset.category === 'Non-Serial' ||
                            String(asset.stock_type).toLowerCase().includes('meter') ||
                            String(asset.stock_type).toLowerCase().includes('roll');
                          
                          return (
                            <div
                              key={asset.id}
                              onClick={() => selectAsset(asset)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                transition: 'background-color 0.12s ease',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#2563EB' : '#152C4A' }}>
                                  {asset.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Merk: <strong>{asset.brand || 'General'}</strong></span>
                                  <span>•</span>
                                  <span>Sisa Stok: <strong>{asset.available_stock || 0} {asset.stock_type || 'Unit'}</strong></span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '99px',
                                  backgroundColor: isConsumable ? '#FEF3C7' : '#F3E8FF',
                                  color: isConsumable ? '#D97706' : '#7E22CE',
                                  border: `1px solid ${isConsumable ? '#FDE68A' : '#E9D5FF'}`
                                }}>
                                  {isConsumable ? 'Consumable' : 'Serial'}
                                </span>
                                {isSelected && (
                                  <Check size={14} color="#2563EB" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Info Master Aset Terpilih */}
                {selectedAssetId && (
                  <div style={{
                    backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
                    padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#475569' }}>
                      <span>Merk: <strong style={{ color: '#152C4A' }}>{availableAssets.find((a) => String(a.id) === String(selectedAssetId))?.brand || 'General'}</strong></span>
                      <span>•</span>
                      <span>Satuan Master: <strong style={{ color: '#2563EB' }}>{satuan}</strong> (Terkunci)</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '99px' }}>
                      Sisa Gudang: {availableAssets.find((a) => String(a.id) === String(selectedAssetId))?.available_stock || 0} {satuan}
                    </div>
                  </div>
                )}

                {/* Tanggal Masuk */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                    Tanggal Masuk
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

                {/* Tipe Aset (Read-Only / Mengikuti Master Data) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>
                      Tipe Aset
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#64748B', fontStyle: 'italic' }}>
                      (Otomatis dari Master Data)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={tipeAset}
                    readOnly
                    disabled
                    style={{
                      ...inputStyle,
                      backgroundColor: '#F8FAFC',
                      color: '#475569',
                      cursor: 'not-allowed',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Detail Section */}
            <div style={{
              borderRadius: '10px',
              border: '1px solid #E2EBF4',
              backgroundColor: '#F8FAFC',
              padding: '0.95rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {/* Header Card */}
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
                  <button
                    type="button"
                    onClick={() => {
                      if (tipeAset === 'Serial') {
                        setShowScanner(true);
                      }
                    }}
                    title="Scan Barcode Kamera"
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '99px',
                      border: '1px solid #DBEAFE',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Serial Dynamic Fields */}
              {tipeAset === 'Serial' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', marginBottom: '5px' }}>
                        Serial Number <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="text"
                          placeholder="Serial Number"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSerialToList();
                            }
                          }}
                          style={{ ...cardInputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                        />
                        {serialNumber.trim() && (
                          <button
                            type="button"
                            onClick={handleAddSerialToList}
                            style={{
                              padding: '0 10px',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        )}
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
                  </div>

                  {/* Registered Serial Numbers Chips */}
                  {serialNumbersList.length > 0 && (
                    <div style={{ marginTop: '0.25rem', backgroundColor: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '70px', overflowY: 'auto' }}>
                        {serialNumbersList.map((sn, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              backgroundColor: '#FFFFFF',
                              color: '#152C4A',
                              border: '1px solid #CBD5E1'
                            }}
                          >
                            {sn}
                            <button
                              type="button"
                              onClick={() => handleRemoveSn(idx)}
                              style={{ border: 'none', background: 'none', padding: 0, color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <X size={11} />
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
                      Jumlah Masuk <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Contoh: 50"
                      value={jumlahStok}
                      onChange={(e) => setJumlahStok(e.target.value)}
                      style={{ ...cardInputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                      onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>
                        Satuan <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <span style={{ fontSize: '0.65rem', color: '#64748B', fontStyle: 'italic' }}>
                        (Terkunci dari Master Data)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Meter / Unit / Roll"
                      value={satuan}
                      readOnly
                      disabled
                      style={{
                        ...cardInputStyle,
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        cursor: 'not-allowed',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Modal per DESIGN.md */}
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
              onClick={handleSimpanStok}
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
      </div>

      {showScanner && (
        <BarcodeScanner
          multiScan={true}
          title={`Scan Barcode — ${selectedAssetName}`}
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
    </>
  );
};
