import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Eye, RefreshCw, HardDrive, Layers, ShieldCheck, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, Clock, CheckCircle2, Flame, Trash2, Filter } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DetailMonitoringRusakModal } from '../../components/DetailMonitoringRusakModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export const MonitoringRusak = () => {
  const [selectedAset, setSelectedAset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL'); // 'ALL' | 'MENUNGGU' | 'SUDAH_DIHANCURKAN'
  const [rusakList, setRusakList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useDocumentTitle('Aset Rusak & Garansi — FiberPulse');

  const fetchDamaged = async () => {
    setLoading(true);
    try {
      const [resAssets, resTx] = await Promise.all([
        fetch('/api/assets?t=' + Date.now()),
        fetch('/api/assets/transactions?t=' + Date.now())
      ]);

      let rawAssets = [];
      if (resAssets.ok) {
        const jsonAssets = await resAssets.json();
        if (Array.isArray(jsonAssets)) rawAssets = jsonAssets;
        else if (jsonAssets && Array.isArray(jsonAssets.data)) rawAssets = jsonAssets.data;
      }

      let rawTx = [];
      if (resTx.ok) {
        const jsonTx = await resTx.json();
        if (Array.isArray(jsonTx)) rawTx = jsonTx;
        else if (jsonTx && Array.isArray(jsonTx.data)) rawTx = jsonTx.data;
      }

      // 1. Assets currently waiting for scrap (>90 days / damaged)
      const waitingList = rawAssets
        .filter(item => (item.damaged_stock || 0) > 0)
        .map((item, idx) => ({
          id: `asset-${item.id || idx + 1}`,
          assetId: item.id,
          nama: item.name || `Aset #${item.id}`,
          merk: item.brand || 'General',
          tipe: item.category || 'Hardware',
          tglPenghancuran: item.updated_at ? item.updated_at.split('T')[0] : '2026-07-06',
          jumlah: `${item.damaged_stock} ${item.stock_type || 'Unit'}`,
          statusPemusnahan: 'Menunggu Pemusnahan',
          statusSub: '>90 Hari',
          isDestroyed: false,
          raw: item
        }));

      // 2. Transactions already scrapped / destroyed
      const destroyedList = rawTx
        .filter(tx => {
          const notes = (tx.notes || '').toLowerCase();
          const type = (tx.type || '').toLowerCase();
          return (type === 'rusak' || type === 'scrap') && 
                 (notes.includes('pemusnahan') || notes.includes('penghancuran') || notes.includes('scrap') || notes.includes('ba-'));
        })
        .map((tx, idx) => {
          const matchedAsset = rawAssets.find(a => a.id === tx.asset_id) || tx.asset;
          let baNum = 'BA-SCRAP';
          if (tx.notes && tx.notes.includes('BA-')) {
            const m = tx.notes.match(/(BA-[A-Za-z0-9\-]+)/);
            if (m) baNum = m[1];
          }
          return {
            id: `tx-${tx.id || idx + 1}`,
            assetId: tx.asset_id,
            nama: matchedAsset?.name || tx.notes || `Aset #${tx.asset_id}`,
            merk: matchedAsset?.brand || 'General',
            tipe: matchedAsset?.category || 'Scrap / Disposal',
            tglPenghancuran: tx.created_at ? tx.created_at.split('T')[0] : '2026-08-01',
            jumlah: `${tx.quantity || 1} ${matchedAsset?.stock_type || 'Unit'}`,
            statusPemusnahan: 'Sudah Dihancurkan',
            statusSub: 'BA Terbit',
            baNumber: baNum,
            isDestroyed: true,
            raw: {
              ...(matchedAsset || {}),
              id: tx.asset_id || matchedAsset?.id,
              name: matchedAsset?.name || tx.notes,
              damaged_stock: 0,
              photo_url: tx.photo_url || matchedAsset?.photo_url
            },
            txRaw: tx
          };
        });

      setRusakList([...waitingList, ...destroyedList]);
    } catch (e) {
      console.error('Failed fetching MonitoringRusak:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDamaged();
  }, []);

  const handleDetail = (item) => {
    setSelectedAset(item);
    setIsModalOpen(true);
  };

  const filteredData = rusakList.filter(item => {
    // Tab filter
    if (tabFilter === 'MENUNGGU' && item.statusPemusnahan !== 'Menunggu Pemusnahan') return false;
    if (tabFilter === 'SUDAH_DIHANCURKAN' && item.statusPemusnahan !== 'Sudah Dihancurkan') return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (item.nama || '').toLowerCase().includes(q) ||
           (item.merk || '').toLowerCase().includes(q) ||
           (item.tipe || '').toLowerCase().includes(q) ||
           (item.jumlah || '').toLowerCase().includes(q) ||
           (item.statusPemusnahan || '').toLowerCase().includes(q);
  });

  // Export Excel Handler
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data aset rusak untuk diekspor.');
      return;
    }
    const toastId = toast.loading('Menyiapkan file Excel Rekapitulasi Aset Rusak...');
    const headers = ['No', 'Nama Aset', 'Merk', 'Kategori', 'Jumlah Rusak', 'Estimasi/Tgl Musnah', 'Status Pemusnahan'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.nama,
      item.merk,
      item.tipe,
      item.jumlah,
      item.tglPenghancuran,
      item.statusPemusnahan === 'Sudah Dihancurkan' ? 'Sudah Dihancurkan (BA Terbit)' : 'Menunggu Pemusnahan (>90 Hari)'
    ]);
    exportToExcel('Rekapitulasi_Aset_Rusak_SGT', headers, rows);
    toast.success('File Excel data aset rusak berhasil diunduh.', { id: toastId });
  };

  // Print Berita Acara Pemusnahan Handler
  const handlePrintBeritaAcara = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data aset rusak untuk dicetak.');
      return;
    }
    const toastId = toast.loading('Menyiapkan dokumen Berita Acara Pemusnahan PDF...');
    const headers = ['No', 'Nama Aset / Perangkat', 'Merk', 'Kategori', 'Jumlah', 'Status Eksekusi Scrap'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `<strong>${item.nama}</strong>`,
      item.merk,
      item.tipe,
      `<strong>${item.jumlah}</strong>`,
      item.statusPemusnahan === 'Sudah Dihancurkan' ? 'Sudah Dihancurkan (Selesai Scrap)' : 'Menunggu Pemusnahan (>90 Hari)'
    ]);
    printReportDocument({
      title: 'BERITA ACARA PEMUSNAHAN ASET RUSAK & SCRAP',
      subtitle: 'Proses Penghapusan Aset Rusak Melewati Batas Simpan 90 Hari Sesuai Prosedur Pengelolaan Logistik',
      docNumber: `BA-SCRAP-${Date.now().toString().slice(-6)}`,
      headers,
      rows,
      notes: 'Dengan diterbitkannya Berita Acara ini, seluruh unit perangkat rusak yang terdaftar di atas telah diverifikasi fisik dan dinyatakan tidak dapat diperbaiki (Scrap/Disposal).',
      signee1: 'Admin Logistik & Pergudangan',
      signee2: 'Kepala Operasional / Direktur Teknik'
    });
    toast.success('Dokumen Berita Acara PDF siap dicetak / disimpan.', { id: toastId });
  };

  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === 'All' ? filteredData.length || 1 : itemsPerPage));
  const currentData = itemsPerPage === 'All' 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalSKURusak = rusakList.length;
  const menungguCount = rusakList.filter(r => r.statusPemusnahan === 'Menunggu Pemusnahan').length;
  const dihancurkanCount = rusakList.filter(r => r.statusPemusnahan === 'Sudah Dihancurkan').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <DetailMonitoringRusakModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchDamaged();
        }}
        data={selectedAset}
      />

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
            Monitoring Aset Rusak & Pemusnahan
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Pelacakan perangkat rusak, status garansi, dan Berita Acara Pemusnahan Aset Scrap.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportExcel}
            title="Unduh Data Rusak ke Excel"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#059669',
              fontWeight: 700,
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <FileSpreadsheet size={14} color="#059669" />
            <span>Ekspor Excel</span>
          </button>
          <button 
            onClick={handlePrintBeritaAcara}
            title="Cetak Berita Acara Pemusnahan"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#DC2626',
              fontWeight: 700,
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Printer size={14} color="#DC2626" />
            <span>Cetak Berita Acara</span>
          </button>
          <button 
            onClick={fetchDamaged} 
            disabled={loading}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontWeight: 600,
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Aset Rusak & Scrap */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TOTAL RUSAK &amp; SCRAP</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: totalSKURusak > 0 ? '#FEF2F2' : '#F1F7FC', color: totalSKURusak > 0 ? '#EF4444' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: totalSKURusak > 0 ? '#EF4444' : '#152C4A', letterSpacing: '-0.02em' }}>
              {totalSKURusak} Item
            </div>
            <p style={{ fontSize: '0.7rem', color: totalSKURusak > 0 ? '#DC2626' : '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Total Record Logistik Kerusakan</p>
          </div>
        </div>

        {/* Card 2: Menunggu Pemusnahan (>90 Hari) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>MENUNGGU PEMUSNAHAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: menungguCount > 0 ? '#D97706' : '#152C4A', letterSpacing: '-0.02em' }}>
              {menungguCount} Unit
            </div>
            <p style={{ fontSize: '0.7rem', color: '#B45309', margin: '3px 0 0 0', fontWeight: 500 }}>Karantina &gt;90 Hari (Siap Scrap)</p>
          </div>
        </div>

        {/* Card 3: Sudah Dihancurkan (BA Terbit) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>SUDAH DIHANCURKAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
              {dihancurkanCount} Unit
            </div>
            <p style={{ fontSize: '0.7rem', color: '#047857', margin: '3px 0 0 0', fontWeight: 500 }}>Selesai Scrap &amp; Berita Acara Terbit</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Tab Filter Status Pemusnahan */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          padding: '6px 12px 0 12px',
          gap: '4px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            type="button"
            onClick={() => { setTabFilter('ALL'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.6rem 1rem',
              fontSize: '0.78rem',
              fontWeight: tabFilter === 'ALL' ? 800 : 600,
              color: tabFilter === 'ALL' ? '#2563EB' : '#64748B',
              border: 'none',
              borderBottom: tabFilter === 'ALL' ? '2.5px solid #2563EB' : '2.5px solid transparent',
              backgroundColor: tabFilter === 'ALL' ? '#FFFFFF' : 'transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Semua Status</span>
            <span style={{
              backgroundColor: tabFilter === 'ALL' ? '#EFF6FF' : '#E2E8F0',
              color: tabFilter === 'ALL' ? '#2563EB' : '#475569',
              border: `1px solid ${tabFilter === 'ALL' ? '#DBEAFE' : '#CBD5E1'}`,
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '99px',
              fontWeight: 800
            }}>
              {rusakList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTabFilter('MENUNGGU'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.6rem 1rem',
              fontSize: '0.78rem',
              fontWeight: tabFilter === 'MENUNGGU' ? 800 : 600,
              color: tabFilter === 'MENUNGGU' ? '#D97706' : '#64748B',
              border: 'none',
              borderBottom: tabFilter === 'MENUNGGU' ? '2.5px solid #D97706' : '2.5px solid transparent',
              backgroundColor: tabFilter === 'MENUNGGU' ? '#FFFFFF' : 'transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={14} color={tabFilter === 'MENUNGGU' ? '#D97706' : '#64748B'} />
            <span>Menunggu Pemusnahan</span>
            <span style={{
              backgroundColor: tabFilter === 'MENUNGGU' ? '#FEF3C7' : '#E2E8F0',
              color: tabFilter === 'MENUNGGU' ? '#D97706' : '#475569',
              border: `1px solid ${tabFilter === 'MENUNGGU' ? '#FDE68A' : '#CBD5E1'}`,
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '99px',
              fontWeight: 800
            }}>
              {menungguCount} Unit
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTabFilter('SUDAH_DIHANCURKAN'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.6rem 1rem',
              fontSize: '0.78rem',
              fontWeight: tabFilter === 'SUDAH_DIHANCURKAN' ? 800 : 600,
              color: tabFilter === 'SUDAH_DIHANCURKAN' ? '#059669' : '#64748B',
              border: 'none',
              borderBottom: tabFilter === 'SUDAH_DIHANCURKAN' ? '2.5px solid #059669' : '2.5px solid transparent',
              backgroundColor: tabFilter === 'SUDAH_DIHANCURKAN' ? '#FFFFFF' : 'transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCircle2 size={14} color={tabFilter === 'SUDAH_DIHANCURKAN' ? '#059669' : '#64748B'} />
            <span>Sudah Dihancurkan</span>
            <span style={{
              backgroundColor: tabFilter === 'SUDAH_DIHANCURKAN' ? '#ECFDF5' : '#E2E8F0',
              color: tabFilter === 'SUDAH_DIHANCURKAN' ? '#059669' : '#475569',
              border: `1px solid ${tabFilter === 'SUDAH_DIHANCURKAN' ? '#A7F3D0' : '#CBD5E1'}`,
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '99px',
              fontWeight: 800
            }}>
              {dihancurkanCount} Unit
            </span>
          </button>
        </div>

        {/* Table Toolbar Search */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari nama aset rusak, merk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
                backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
            Menampilkan: <span style={{ color: '#152C4A', fontWeight: 800 }}>{filteredData.length}</span> Item
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '920px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA ASET</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>MERK</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>KATEGORI</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TGL UPDATE / EKSEKUSI</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>JUMLAH</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>STATUS PEMUSNAHAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#059669', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={20} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#059669' }}>
                        {searchQuery ? `Tidak ada aset yang cocok dengan "${searchQuery}"` : 'Tidak Ada Data Pada Kategori Ini'}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 500 }}>
                        {searchQuery ? 'Coba gunakan kata kunci lain.' : 'Tidak ada laporan unit pada filter yang dipilih.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: idx === currentData.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: row.isDestroyed ? '#475569' : '#DC2626', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.nama}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.merk}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{ backgroundColor: row.isDestroyed ? '#F1F5F9' : '#FEF2F2', color: row.isDestroyed ? '#475569' : '#DC2626', border: `1px solid ${row.isDestroyed ? '#CBD5E1' : '#FECACA'}`, padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {row.tipe}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.tglPenghancuran}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{ backgroundColor: row.isDestroyed ? '#475569' : '#DC2626', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {row.jumlah}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.statusPemusnahan === 'Sudah Dihancurkan' ? (
                        <span style={{
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <CheckCircle2 size={12} color="#059669" />
                          <span>Sudah Dihancurkan</span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#047857' }}>
                            (BA Terbit)
                          </span>
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          border: '1px solid #FDE68A',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <Clock size={12} color="#D97706" />
                          <span>Menunggu Pemusnahan</span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#B45309' }}>
                            (&gt;90 Hari)
                          </span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <button 
                        onClick={() => handleDetail(row)}
                        title="Lihat Detail & Foto Kerusakan"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', borderRadius: '6px',
                          backgroundColor: '#EFF8FC', color: '#2563EB',
                          border: '1px solid #D8E6F3', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Eye size={12} /> Detail
                      </button>
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

    </div>
  );
};
