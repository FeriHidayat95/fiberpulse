import React, { useState, useEffect } from 'react';
import { X, Edit2, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertTriangle, History, Calendar, User, Package, Camera, Download, ZoomIn, Image as ImageIcon, Layers, AlertCircle } from 'lucide-react';
import { EditSerialModal } from './EditSerialModal';
import toast from 'react-hot-toast';

export const DetailAsetGudangModal = ({ isOpen, onClose, data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('serials'); // 'serials' | 'mutations'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [serials, setSerials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const fetchSerials = async () => {
    try {
      const res = await fetch(`/api/assets/${data.id}/items`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mappedSerials = json.data.map(item => ({
          id: item.id,
          sn: item.serial_number || item.sn,
          year: item.year || item.tahun || (item.created_at ? new Date(item.created_at).getFullYear() : '2026'),
          tahun: item.year || item.tahun || (item.created_at ? new Date(item.created_at).getFullYear() : '2026'),
          status: item.status || 'Ready di Gudang',
          mac: item.mac_address || '-',
          lokasi: item.location || item.keberadaan || 'Gudang Utama',
          keberadaan: item.location || item.keberadaan || 'Gudang Utama',
          teknisi: item.technician_name || item.technician?.name || (item.status === 'Terpasang' ? (item.customer_name || 'Pelanggan') : (item.status === 'Dipinjam' ? 'Teknisi Lapangan' : '-')),
          tglMasuk: item.created_at ? item.created_at.split('T')[0] : (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          kondisi: item.condition || item.kondisi || 'Baru'
        }));
        setSerials(mappedSerials);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await fetch(`/api/assets/transactions?asset_id=${data.id}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTransactions(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (isOpen && data) {
      fetchSerials();
      fetchTransactions();
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleEditClick = (serial) => {
    setSelectedSerial({
      ...serial,
      sn: serial.sn || serial.serial_number,
      tahun: serial.tahun || serial.year || '2026',
      kondisi: serial.kondisi === 'Baru' ? 'Baik' : (serial.kondisi || 'Baik'),
      status: serial.status || 'Gudang',
      keberadaan: serial.keberadaan || serial.lokasi || serial.location || 'Gudang Utama'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSerial = (updatedSerial) => {
    setSerials(prev => prev.map(item => item.sn === selectedSerial?.sn ? { ...item, ...updatedSerial } : item));
    fetchSerials();
    fetchTransactions();
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem 1rem', overflowY: 'auto', boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '850px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex', flexDirection: 'column', maxHeight: 'min(90vh, 850px)',
          margin: 'auto', flexShrink: 0, overflow: 'hidden', border: '1px solid #E2E8F0'
        }}>
          
          {/* Header */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '1.15rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
            flexShrink: 0
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#1E293B' }}>
                Detail Gudang — {data.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
                Merk: <strong style={{color: '#334155'}}>{data.merk || 'General'}</strong> — Kategori: <strong style={{color: '#334155'}}>{data.category || data.type || 'Consumable'}</strong>
              </p>
            </div>
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
              INFORMASI ASET
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>Nama Aset</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{data.name}</p>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>Merk</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{data.merk || '—'}</p>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>Tipe / Kategori</p>
                <span className={`status-${data.type ? data.type.toLowerCase() : 'serial'}`} style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {data.type || data.category || 'Unit'}
                </span>
              </div>
            </div>

            {/* Breakdown Sisa Stok Enterprise */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#F0FDF4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.02em' }}>STOK BARU (READY)</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A', margin: 0 }}>
                  {data.raw?.available_stock || 0} <span style={{fontSize: '0.75rem', fontWeight: 600}}>{data.raw?.stock_type || 'Unit'}</span>
                </p>
              </div>
              <div style={{ backgroundColor: '#FEFCE8', padding: '0.85rem', borderRadius: '10px', border: '1px solid #FEF08A', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: '#A16207', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.02em' }}>STOK CABUTAN (RTS)</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#CA8A04', margin: 0 }}>
                  {data.raw?.cabutan_stock || 0} <span style={{fontSize: '0.75rem', fontWeight: 600}}>{data.raw?.stock_type || 'Unit'}</span>
                </p>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <p style={{ fontSize: '0.7rem', color: '#152C4A', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '0.04em' }}>KONDISI BARANG</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    Siap Pakai: {(data.raw?.available_stock || 0) + (data.raw?.cabutan_stock || 0)} {data.raw?.stock_type || 'Unit'}
                  </span>
                  <span style={{ backgroundColor: (data.raw?.damaged_stock > 0) ? '#FEF2F2' : '#F1F5F9', color: (data.raw?.damaged_stock > 0) ? '#DC2626' : '#64748B', border: `1px solid ${(data.raw?.damaged_stock > 0) ? '#FECACA' : '#CBD5E1'}`, padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    Rusak: {data.raw?.damaged_stock || 0} {data.raw?.stock_type || 'Unit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation (Audit Lifecycle) */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              marginBottom: '1.25rem',
              gap: '4px',
              backgroundColor: '#F8FAFC',
              padding: '4px 4px 0 4px',
              borderRadius: '10px 10px 0 0'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('serials')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.65rem 1.1rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'serials' ? 800 : 600,
                  color: activeTab === 'serials' ? '#2563EB' : '#64748B',
                  border: 'none',
                  borderBottom: activeTab === 'serials' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  backgroundColor: activeTab === 'serials' ? '#FFFFFF' : 'transparent',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Package size={15} color={activeTab === 'serials' ? '#2563EB' : '#64748B'} />
                <span>Tab 1: Rekam Jejak Serial / Status Unit</span>
                <span style={{
                  backgroundColor: activeTab === 'serials' ? '#EFF6FF' : '#E2E8F0',
                  color: activeTab === 'serials' ? '#2563EB' : '#475569',
                  border: `1px solid ${activeTab === 'serials' ? '#DBEAFE' : '#CBD5E1'}`,
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '99px',
                  fontWeight: 800
                }}>
                  {isConsumable ? 'Consumable' : `${serials.length} Unit`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mutations')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.65rem 1.1rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'mutations' ? 800 : 600,
                  color: activeTab === 'mutations' ? '#2563EB' : '#64748B',
                  border: 'none',
                  borderBottom: activeTab === 'mutations' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  backgroundColor: activeTab === 'mutations' ? '#FFFFFF' : 'transparent',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <History size={15} color={activeTab === 'mutations' ? '#2563EB' : '#64748B'} />
                <span>Tab 2: Riwayat Mutasi & Tanggal</span>
                <span style={{
                  backgroundColor: activeTab === 'mutations' ? '#EFF6FF' : '#E2E8F0',
                  color: activeTab === 'mutations' ? '#2563EB' : '#475569',
                  border: `1px solid ${activeTab === 'mutations' ? '#DBEAFE' : '#CBD5E1'}`,
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '99px',
                  fontWeight: 800
                }}>
                  {transactions.length} Mutasi
                </span>
              </button>
            </div>

            {/* TAB 1 CONTENT: Rekam Jejak Serial / Status Unit */}
            {activeTab === 'serials' && (
              <div>
                {isConsumable ? (
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Layers size={15} />
                        </div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
                          INFORMASI MATERIAL CONSUMABLE (NON-SERIAL)
                        </p>
                      </div>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>
                        Tracking Kuantitas ({data.raw?.stock_type || 'Meter'})
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL STOK TERDAFTAR</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>
                          {data.raw?.total_stock || data.qty || 0} {data.raw?.stock_type || 'Meter'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>STOK SIAP PAKAI</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace', marginTop: '2px' }}>
                          {data.raw?.available_stock || 0} {data.raw?.stock_type || 'Meter'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>SATUAN LOGISTIK</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                          {data.raw?.stock_type || 'Meter'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={14} color="#64748B" style={{ flexShrink: 0 }} />
                      <span>
                        Aset ini berjenis material habis pakai (*consumable*). Pengelolaan mutasi dilakukan berbasis akumulasi kuantitas volume satuan tanpa pelacakan nomor seri (*Serial Number*) individual per unit.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} color="#2563EB" />
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '0.02em' }}>
                          POSISI &amp; STATUS UNIT INDIVIDUAL ({serials.length} UNIT)
                        </p>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                        <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}>
                          <tr>
                            <th style={{ padding: '0.65rem 0.85rem' }}>NO.</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>SERIAL NUMBER (SN)</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>TAHUN</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>KONDISI</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>STATUS ASET</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>KEBERADAAN / LOKASI</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>TEKNISI / PIC</th>
                            <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serials.length === 0 ? (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                                Belum ada unit serial number terdaftar
                              </td>
                            </tr>
                          ) : (
                            serials.map((s, idx) => (
                              <tr key={s.id || idx} style={{ borderBottom: idx === serials.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? 'white' : '#FCFDFE' }}>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B', fontFamily: 'monospace' }}>{idx + 1}</td>
                                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>
                                  {s.sn || s.serial_number || '-'}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B', fontWeight: 700, fontFamily: 'monospace' }}>
                                  {s.year || s.tahun || '2026'}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem' }}>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
                                    backgroundColor: s.kondisi === 'Baru' || s.kondisi === 'Baik' ? '#ECFDF5' : (s.kondisi === 'Rusak' ? '#FEF2F2' : '#FFFBEB'),
                                    color: s.kondisi === 'Baru' || s.kondisi === 'Baik' ? '#059669' : (s.kondisi === 'Rusak' ? '#DC2626' : '#D97706'),
                                    border: `1px solid ${s.kondisi === 'Baru' || s.kondisi === 'Baik' ? '#A7F3D0' : (s.kondisi === 'Rusak' ? '#FECACA' : '#FDE68A')}`
                                  }}>
                                    {s.kondisi || 'Baik'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem' }}>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
                                    backgroundColor: s.status === 'Terpasang' ? '#EFF6FF' : (s.status === 'Rusak' ? '#FEF2F2' : '#F0FDF4'),
                                    color: s.status === 'Terpasang' ? '#2563EB' : (s.status === 'Rusak' ? '#DC2626' : '#15803D'),
                                    border: `1px solid ${s.status === 'Terpasang' ? '#DBEAFE' : (s.status === 'Rusak' ? '#FECACA' : '#BBF7D0')}`
                                  }}>
                                    {s.status}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#334155', fontWeight: 600, fontSize: '0.75rem' }}>
                                  {s.keberadaan || s.lokasi || 'Gudang Utama'}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#475569', fontSize: '0.75rem' }}>
                                  {s.teknisi || '-'}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleEditClick(s)}
                                    title="Edit Serial & Tahun"
                                    style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}
                                  >
                                    <Edit2 size={11} /> Edit
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: Riwayat Mutasi & Tanggal (Jurnal Kronologis) */}
            {activeTab === 'mutations' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} color="#2563EB" />
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '0.02em' }}>
                      JURNAL KRONOLOGIS MUTASI TANGGAL ({transactions.length} TRANSAKSI)
                    </p>
                  </div>
                  <button 
                    onClick={fetchTransactions} 
                    disabled={loadingTx}
                    style={{
                      background: 'none', border: '1px solid #E2E8F0', padding: '5px 12px', borderRadius: '8px',
                      fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white',
                      transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <RefreshCw size={12} className={loadingTx ? 'animate-spin' : ''} /> Refresh Data
                  </button>
                </div>

                {loadingTx ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="animate-spin" color="#3B82F6" />
                    <span>Memuat jurnal kronologis mutasi...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div style={{
                    padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC',
                    borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B',
                    fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                  }}>
                    <Package size={32} color="#94A3B8" />
                    <span style={{fontWeight: 700, color: '#475569'}}>Belum Ada Jurnal Mutasi</span>
                    <span style={{fontSize: '0.75rem'}}>Riwayat mutasi Masuk Supplier, Keluar Pasang, Masuk Cabutan, dan Pindah Rusak akan tercatat di sini secara kronologis.</span>
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1rem' }}>TANGGAL &amp; WAKTU</th>
                          <th style={{ padding: '0.75rem 1rem' }}>JENIS TRANSAKSI</th>
                          <th style={{ padding: '0.75rem 1rem' }}>KUANTITAS</th>
                          <th style={{ padding: '0.75rem 1rem' }}>TEKNISI / PIC</th>
                          <th style={{ padding: '0.75rem 1rem' }}>KETERANGAN / ASAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => {
                          let bgBadge = '#F1F5F9'; let colorBadge = '#475569'; let iconTx = null; let prefixSign = '';
                          let jenisLabel = tx.type || 'Mutasi';
                          
                          if (tx.type === 'Masuk') {
                            bgBadge = '#DCFCE7'; colorBadge = '#15803D'; prefixSign = '+';
                            jenisLabel = 'Masuk Supplier';
                            iconTx = <ArrowDownLeft size={13} color="#16A34A" />;
                          } else if (tx.type === 'Keluar') {
                            bgBadge = '#DBEAFE'; colorBadge = '#1D4ED8'; prefixSign = '-';
                            jenisLabel = 'Keluar Pasang';
                            iconTx = <ArrowUpRight size={13} color="#2563EB" />;
                          } else if (tx.type === 'Rusak') {
                            bgBadge = '#FEE2E2'; colorBadge = '#B91C1C'; prefixSign = '-';
                            jenisLabel = 'Pindah Rusak';
                            iconTx = <AlertTriangle size={13} color="#DC2626" />;
                          } else if (tx.type === 'Cabutan' || (tx.notes && tx.notes.toLowerCase().includes('cabutan'))) {
                            bgBadge = '#FFEDD5'; colorBadge = '#C2410C'; prefixSign = '+';
                            jenisLabel = 'Masuk Cabutan';
                            iconTx = <RefreshCw size={13} color="#D97706" />;
                          }

                          const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-';

                          return (
                            <tr key={tx.id || idx} style={{ borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? 'white' : '#FCFDFE' }}>
                              <td style={{ padding: '0.75rem 1rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                  <Calendar size={13} color="#94A3B8" />
                                  {dateStr}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '3px 9px', borderRadius: '99px',
                                  backgroundColor: bgBadge, color: colorBadge,
                                  fontWeight: 700, fontSize: '0.72rem'
                                }}>
                                  {iconTx} {jenisLabel}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                <span style={{color: prefixSign === '+' ? '#16A34A' : '#DC2626'}}>
                                  {prefixSign}{tx.quantity}
                                </span> {data.stock_type || data.asset_unit || 'Unit'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <User size={13} color="#64748B" />
                                  {tx.technician_name || 'Admin Gudang'}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '240px' }}>
                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tx.notes || (tx.type === 'Masuk' ? 'Penambahan stok gudang' : (tx.type === 'Keluar' ? `Pengambilan untuk ${tx.customer_name || 'penugasan'}` : '-'))}
                                </div>
                                {tx.customer_name && tx.customer_name !== '-' && (
                                  <div style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: 600, marginTop: '2px' }}>
                                    👤 {tx.customer_name}
                                  </div>
                                )}
                                {tx.photo_url && (
                                  <button 
                                    onClick={() => setLightboxPhoto({ url: tx.photo_url, title: `Bukti Transaksi — ${data.name || data.nama}`, subtitle: `Oleh: ${tx.technician_name || 'Teknisi'} | Tipe: ${tx.type || 'In/Out'}` })}
                                    title="Lihat foto bukti untuk transaksi ini"
                                    style={{ 
                                      display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px', 
                                      padding: '3px 8px', borderRadius: '6px', 
                                      backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', 
                                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DBEAFE'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                                  >
                                    <Camera size={12} color="#2563EB" /> Bukti Foto
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
            display: 'flex', justifyContent: 'flex-end', flexShrink: 0
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: '#334155',
                color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
            >
              Tutup Modal
            </button>
          </div>
        </div>
      </div>
      
      <EditSerialModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        data={selectedSerial} 
        onSave={handleSaveSerial}
      />

      {/* Enterprise Lightbox Modal di dalam Detail */}
      {lightboxPhoto && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            style={{
              backgroundColor: '#1E293B', borderRadius: '16px', overflow: 'hidden',
              maxWidth: '700px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155', position: 'relative', animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#F8FAFC', margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="#3B82F6" /> {lightboxPhoto.title}
                </h3>
                <p style={{ color: '#94A3B8', margin: '4px 0 0 0', fontSize: '0.8rem' }}>{lightboxPhoto.subtitle}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href={lightboxPhoto.url} target="_blank" rel="noopener noreferrer" download
                  style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#334155', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Download
                </a>
                <button 
                  onClick={() => setLightboxPhoto(null)}
                  style={{ background: '#EF4444', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', minHeight: '300px', maxHeight: '70vh', overflow: 'hidden' }}>
              <img 
                src={lightboxPhoto.url} alt="Bukti Cabutan" loading="lazy"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', padding: '2rem' }}>
                <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#CBD5E1' }}>Gagal memuat lampiran foto dari server</p>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>File mungkin telah dipindahkan atau koneksi terputus</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
