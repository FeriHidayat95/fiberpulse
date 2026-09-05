import React, { useState, useEffect } from 'react';
import { X, Package, ShieldCheck, History, Calendar, User, ArrowDownLeft, ArrowUpRight, AlertTriangle, RefreshCw, Layers, AlertCircle } from 'lucide-react';

export const DetailMonitoringAsetModal = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState('serials');
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (isOpen && data && data.id) {
      setLoadingTx(true);
      fetch(`/api/assets/transactions?asset_id=${data.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            setTransactions(json.data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingTx(false));
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const serialHistory = data.serials || [];
  const isConsumable = String(data.tipe).toLowerCase() === 'consumable' || String(data.tipe).toLowerCase() === 'non-serial' || String(data.total).toLowerCase().includes('meter') || String(data.total).toLowerCase().includes('roll');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '780px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
        border: '1px solid #E2E8F0', boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
                Audit Lifecycle Aset — {data.nama}
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                Merk: {data.merk || 'General'} • Kategori: {data.tipe || 'Consumable'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NAMA ASET</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{data.nama}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>MERK / BRAND</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{data.merk || 'General'}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TOTAL TERDAFTAR</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: '2px' }}>{data.total}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>JUMLAH KELUAR</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: '2px' }}>{data.jmlKeluar || '0 Unit'}</div>
            </div>
          </div>

          {/* 2 Tab Navigation (Audit Lifecycle) */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            gap: '4px',
            backgroundColor: '#F8FAFC',
            padding: '4px 4px 0 4px',
            borderRadius: '8px 8px 0 0'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('serials')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.55rem 1rem',
                fontSize: '0.75rem',
                fontWeight: activeTab === 'serials' ? 800 : 600,
                color: activeTab === 'serials' ? '#2563EB' : '#64748B',
                border: 'none',
                borderBottom: activeTab === 'serials' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                backgroundColor: activeTab === 'serials' ? '#FFFFFF' : 'transparent',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={14} color={activeTab === 'serials' ? '#2563EB' : '#64748B'} />
              <span>Tab 1: Rekam Jejak Serial / Status Unit</span>
              <span style={{
                backgroundColor: activeTab === 'serials' ? '#EFF6FF' : '#E2E8F0',
                color: activeTab === 'serials' ? '#2563EB' : '#475569',
                border: `1px solid ${activeTab === 'serials' ? '#DBEAFE' : '#CBD5E1'}`,
                fontSize: '0.62rem',
                padding: '1px 6px',
                borderRadius: '99px',
                fontWeight: 800
              }}>
                {isConsumable ? 'Consumable' : `${serialHistory.length} Unit`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mutations')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.55rem 1rem',
                fontSize: '0.75rem',
                fontWeight: activeTab === 'mutations' ? 800 : 600,
                color: activeTab === 'mutations' ? '#2563EB' : '#64748B',
                border: 'none',
                borderBottom: activeTab === 'mutations' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                backgroundColor: activeTab === 'mutations' ? '#FFFFFF' : 'transparent',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <History size={14} color={activeTab === 'mutations' ? '#2563EB' : '#64748B'} />
              <span>Tab 2: Riwayat Mutasi &amp; Tanggal</span>
              <span style={{
                backgroundColor: activeTab === 'mutations' ? '#EFF6FF' : '#E2E8F0',
                color: activeTab === 'mutations' ? '#2563EB' : '#475569',
                border: `1px solid ${activeTab === 'mutations' ? '#DBEAFE' : '#CBD5E1'}`,
                fontSize: '0.62rem',
                padding: '1px 6px',
                borderRadius: '99px',
                fontWeight: 800
              }}>
                {transactions.length} Mutasi
              </span>
            </button>
          </div>

          {/* TAB 1: Rekam Jejak Serial / Status Unit */}
          {activeTab === 'serials' && (
            <div>
              {isConsumable ? (
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#152C4A' }}>
                      Material Habis Pakai (Non-Serial)
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>
                      Bulk Volume
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    Aset ini berjenis material consumable/non-serial sehingga tidak memiliki pelacakan nomor seri (*Serial Number*) per unit fisik. Pencatatan logistik dikelola berdasarkan akumulasi volume kuantitas total dan riwayat mutasi masuk/keluar.
                  </p>
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>SERIAL NUMBER</th>
                        <th style={{ padding: '8px 12px' }}>TAHUN</th>
                        <th style={{ padding: '8px 12px' }}>STATUS ASET</th>
                        <th style={{ padding: '8px 12px' }}>KEBERADAAN</th>
                        <th style={{ padding: '8px 12px' }}>TEKNISI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serialHistory.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                            Tidak ada data nomor seri terdaftar
                          </td>
                        </tr>
                      ) : (
                        serialHistory.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx === serialHistory.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>{item.sn}</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.tahun}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                {item.status || 'Tersedia'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 600 }}>{item.keberadaan || 'Gudang'}</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.teknisi || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Riwayat Mutasi & Tanggal (Jurnal Kronologis) */}
          {activeTab === 'mutations' && (
            <div>
              {loadingTx ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={20} className="animate-spin" color="#3B82F6" />
                  <span>Memuat jurnal mutasi tanggal...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.75rem' }}>
                  Belum ada catatan mutasi tanggal untuk aset ini.
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>TANGGAL &amp; WAKTU</th>
                        <th style={{ padding: '8px 12px' }}>JENIS TRANSAKSI</th>
                        <th style={{ padding: '8px 12px' }}>KUANTITAS</th>
                        <th style={{ padding: '8px 12px' }}>TEKNISI / PIC</th>
                        <th style={{ padding: '8px 12px' }}>KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => {
                        let bgBadge = '#F1F5F9'; let colorBadge = '#475569'; let iconTx = null; let prefixSign = '';
                        let jenisLabel = tx.type || 'Mutasi';
                        
                        if (tx.type === 'Masuk') {
                          bgBadge = '#DCFCE7'; colorBadge = '#15803D'; prefixSign = '+';
                          jenisLabel = 'Masuk Supplier';
                          iconTx = <ArrowDownLeft size={12} color="#16A34A" />;
                        } else if (tx.type === 'Keluar') {
                          bgBadge = '#DBEAFE'; colorBadge = '#1D4ED8'; prefixSign = '-';
                          jenisLabel = 'Keluar Pasang';
                          iconTx = <ArrowUpRight size={12} color="#2563EB" />;
                        } else if (tx.type === 'Rusak') {
                          bgBadge = '#FEE2E2'; colorBadge = '#B91C1C'; prefixSign = '-';
                          jenisLabel = 'Pindah Rusak';
                          iconTx = <AlertTriangle size={12} color="#DC2626" />;
                        } else if (tx.type === 'Cabutan' || (tx.notes && tx.notes.toLowerCase().includes('cabutan'))) {
                          bgBadge = '#FFEDD5'; colorBadge = '#C2410C'; prefixSign = '+';
                          jenisLabel = 'Masuk Cabutan';
                          iconTx = <RefreshCw size={12} color="#D97706" />;
                        }

                        const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '-';

                        return (
                          <tr key={tx.id || idx} style={{ borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                <Calendar size={12} color="#94A3B8" />
                                {dateStr}
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 8px', borderRadius: '99px',
                                backgroundColor: bgBadge, color: colorBadge,
                                fontWeight: 700, fontSize: '0.68rem'
                              }}>
                                {iconTx} {jenisLabel}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                              <span style={{color: prefixSign === '+' ? '#16A34A' : '#DC2626'}}>
                                {prefixSign}{tx.quantity}
                              </span> Unit
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <User size={12} color="#64748B" />
                                {tx.technician_name || 'Admin Gudang'}
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#475569', maxWidth: '200px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tx.notes || '-'}
                              </div>
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
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
          <button 
            onClick={onClose}
            style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
