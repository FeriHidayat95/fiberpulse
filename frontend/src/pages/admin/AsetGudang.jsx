import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Search, RefreshCw, Package, CheckCircle2, Layers, 
  AlertTriangle, Eye, ArrowDownLeft, HardDrive, FileSpreadsheet, Printer, Plus 
} from 'lucide-react';
import { DetailAsetGudangModal } from '../../components/DetailAsetGudangModal';
import { TambahAsetModal } from '../../components/TambahAsetModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export const AsetGudang = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAset, setSelectedAset] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Role-based Access Control
  const userRole = (localStorage.getItem('user_role') || '').toLowerCase().trim();
  const isGudangAdmin = ['admin_gudang', 'kepala_gudang', 'admin', 'admin gudang', 'kepala teknisi gudang', 'super admin', 'administrator'].includes(userRole);

  const handleOpenTambahSku = () => {
    if (!isGudangAdmin) {
      toast.error('Akses Dibatasi: Input aset baru hanya dapat dilakukan oleh akun dengan peran Admin Gudang atau Kepala Teknisi Gudang.', { duration: 4500 });
      return;
    }
    setIsTambahModalOpen(true);
  };

  useDocumentTitle('Stok Gudang Master — FiberPulse');

  const { data: assets = [], isLoading: loading, refetch: fetchAssets } = useQuery({
    queryKey: ['assets-gudang'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    queryFn: async () => {
      try {
        const res = await fetch('/api/assets?t=' + Date.now());
        if (!res.ok) return [];
        const json = await res.json();
        let rawList = [];
        if (Array.isArray(json)) rawList = json;
        else if (json && json.success && Array.isArray(json.data)) rawList = json.data;
        else if (json && Array.isArray(json.data)) rawList = json.data;

        return rawList.map(a => ({
          id: a.id,
          name: a.name || 'Unknown Asset',
          type: a.category ? a.category : 'Lainnya',
          qty: `${a.available_stock} ${a.stock_type || 'Unit'}`,
          merk: a.brand || 'General',
          raw: a
        }));
      } catch (err) {
        console.error("Gagal fetch assets:", err);
        return [];
      }
    }
  });

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDetailClick = (item, e) => {
    e.preventDefault();
    setSelectedAset(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveNewAsset = () => {
    fetchAssets();
    queryClient.invalidateQueries({ queryKey: ['assets-gudang'] });
    setIsTambahModalOpen(false);
  };

  const filteredAssets = assets.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && String(item.name).toLowerCase().includes(q)) || 
      (item.merk && String(item.merk).toLowerCase().includes(q)) ||
      (item.type && String(item.type).toLowerCase().includes(q)) ||
      (item.qty && String(item.qty).toLowerCase().includes(q)) ||
      (item.raw?.stock_type && String(item.raw.stock_type).toLowerCase().includes(q)) ||
      (item.raw?.serial_number && String(item.raw.serial_number).toLowerCase().includes(q)) ||
      (item.raw?.status && String(item.raw.status).toLowerCase().includes(q))
    );
  });

  const totalSku = assets.length;

  const hardwareAssets = assets.filter(a => {
    const st = String(a.raw?.stock_type || '').toLowerCase();
    const cat = String(a.type || '').toLowerCase();
    return !st.includes('meter') && !st.includes('roll') && !cat.includes('kabel') && !cat.includes('fo');
  });

  const materialAssets = assets.filter(a => {
    const st = String(a.raw?.stock_type || '').toLowerCase();
    const cat = String(a.type || '').toLowerCase();
    return st.includes('meter') || st.includes('roll') || cat.includes('kabel') || cat.includes('fo');
  });

  const hardwareBaru = hardwareAssets.reduce((sum, item) => sum + (Number(item.raw?.available_stock) || 0), 0);
  const hardwareCabutan = hardwareAssets.reduce((sum, item) => sum + (Number(item.raw?.cabutan_stock) || 0), 0);
  const hardwareSiapPakai = hardwareBaru + hardwareCabutan;

  const materialBaru = materialAssets.reduce((sum, item) => sum + (Number(item.raw?.available_stock) || 0), 0);
  const materialCabutan = materialAssets.reduce((sum, item) => sum + (Number(item.raw?.cabutan_stock) || 0), 0);
  const materialSiapPakai = materialBaru + materialCabutan;

  const lowStockCount = assets.filter(item => (Number(item.raw?.available_stock) || 0) <= 5).length;

  // Handler: Export to Excel
  const handleExportExcel = () => {
    if (filteredAssets.length === 0) {
      toast.error('Tidak ada data aset untuk diekspor.');
      return;
    }
    const toastId = toast.loading('Menyiapkan file Excel Rekapitulasi Stok...');
    const headers = ['No', 'Nama Aset', 'Merk', 'Tipe', 'Total Masuk', 'Total Keluar', 'Di Gudang', 'Terpasang', 'Rusak', 'Satuan'];
    const rows = filteredAssets.map((item, idx) => {
      const avail = Number(item.raw?.available_stock) || 0;
      const cabutan = Number(item.raw?.cabutan_stock) || 0;
      const used = Number(item.raw?.used_stock) || 0;
      const damaged = Number(item.raw?.damaged_stock) || 0;
      const totalMasuk = item.raw?.total_stock ?? (avail + cabutan + used + damaged);
      const totalKeluar = used;
      const diGudang = avail + cabutan;
      const terpasang = used;
      const rusak = damaged;
      const unitLabel = item.raw?.stock_type || 'Unit';

      return [
        idx + 1,
        item.name,
        item.merk || item.raw?.brand || 'General',
        item.type,
        totalMasuk,
        totalKeluar,
        diGudang,
        terpasang,
        rusak,
        unitLabel
      ];
    });
    exportToExcel('Rekapitulasi_Stok_Gudang_SGT', headers, rows);
    toast.success('File Excel / CSV berhasil diunduh.', { id: toastId });
  };

  // Handler: Print Formal Report Document
  const handlePrintDocument = () => {
    if (filteredAssets.length === 0) {
      toast.error('Tidak ada data aset untuk dicetak.');
      return;
    }
    const toastId = toast.loading('Menyiapkan dokumen Berita Acara PDF...');
    const headers = ['No', 'Nama Aset / Perangkat', 'Merk', 'Tipe', 'Total Masuk', 'Total Keluar', 'Di Gudang', 'Terpasang', 'Rusak'];
    const rows = filteredAssets.map((item, idx) => {
      const avail = Number(item.raw?.available_stock) || 0;
      const cabutan = Number(item.raw?.cabutan_stock) || 0;
      const used = Number(item.raw?.used_stock) || 0;
      const damaged = Number(item.raw?.damaged_stock) || 0;
      const totalMasuk = item.raw?.total_stock ?? (avail + cabutan + used + damaged);
      const totalKeluar = used;
      const diGudang = avail + cabutan;
      const terpasang = used;
      const rusak = damaged;
      const unitLabel = item.raw?.stock_type || 'Unit';

      return [
        idx + 1,
        `<strong>${item.name}</strong>`,
        item.merk || item.raw?.brand || 'General',
        item.type,
        `${totalMasuk} ${unitLabel}`,
        `${totalKeluar} ${unitLabel}`,
        `<strong>${diGudang} ${unitLabel}</strong>`,
        `${terpasang} ${unitLabel}`,
        `<span style="color:${damaged > 0 ? '#DC2626' : '#64748B'};">${rusak} ${unitLabel}</span>`
      ];
    });
    const summaryCards = [
      { label: 'Total SKU Terdaftar', value: `${totalSku} Jenis` },
      { label: 'Hardware Siap Pakai', value: `${hardwareSiapPakai} Unit` },
      { label: 'Kabel FO / Dropcore', value: `${materialSiapPakai} Meter` },
      { label: 'Total Aset Rusak', value: `${assets.reduce((sum, item) => sum + (Number(item.raw?.damaged_stock) || 0), 0)} Unit` }
    ];

    printReportDocument({
      title: 'BERITA ACARA REKAPITULASI STOK GUDANG MASTER',
      subtitle: 'Inventarisasi Fisik Perangkat FTTH & Logistik Jaringan FiberPulse Technologies Inc.',
      docNumber: `BAST-LOG-${Date.now().toString().slice(-6)}`,
      summaryCards,
      headers,
      rows,
      notes: 'Dokumen ini merupakan catatan resmi saldo fisik aset di gudang operasional FiberPulse. Seluruh mutasi telah tervalidasi dengan nomor seri perangkat.'
    });
    toast.success('Dokumen Berita Acara PDF siap dicetak / disimpan.', { id: toastId });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modal Detail Aset */}
      <DetailAsetGudangModal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          fetchAssets();
        }} 
        data={selectedAset} 
        onUpdate={fetchAssets}
      />

      {/* Modal Tambah SKU Baru */}
      <TambahAsetModal 
        isOpen={isTambahModalOpen} 
        onClose={() => setIsTambahModalOpen(false)} 
        onSave={handleSaveNewAsset} 
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
            Stok Gudang (Master Aset)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Pencatatan rincian stok baru, stok cabutan, barang rusak, dan status fisik gudang.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Export Excel Button */}
          <button 
            onClick={handleExportExcel}
            title="Unduh Data ke Excel / CSV"
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

          {/* Print PDF Document Button */}
          <button 
            onClick={handlePrintDocument}
            title="Cetak Berita Acara Resmi"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#2563EB',
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
            <Printer size={14} color="#2563EB" />
            <span>Cetak PDF</span>
          </button>

          {/* Secondary Refresh Button */}
          <button 
            onClick={() => fetchAssets()} 
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

          {/* Button Tambah SKU Baru */}
          <button 
            onClick={handleOpenTambahSku}
            style={{
              backgroundColor: isGudangAdmin ? '#FFFFFF' : '#F8FAFC',
              border: isGudangAdmin ? '1px solid #152C4A' : '1px solid #CBD5E1',
              color: isGudangAdmin ? '#152C4A' : '#94A3B8',
              fontWeight: 700,
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isGudangAdmin ? 'pointer' : 'not-allowed',
              opacity: isGudangAdmin ? 1 : 0.7
            }}
            title={isGudangAdmin ? 'Tambah master SKU aset baru' : 'Akses dibatasi: Khusus Admin Gudang / Kepala Teknisi Gudang'}
          >
            <Plus size={13} />
            <span>Tambah SKU Baru</span>
          </button>

          {/* Primary Action Button (FiberPulse Gradient) */}
          <button 
            onClick={() => navigate('/admin/aset-masuk')}
            className="sgt-btn-primary"
            style={{
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <ArrowDownLeft size={14} />
            <span>Restock Barang</span>
          </button>

        </div>
      </div>
      
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total SKU / Aset */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TOTAL SKU / ASET</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {totalSku} Item
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Item Terdaftar di Gudang</p>
          </div>
        </div>

        {/* Card 2: Stok Ready (Baru) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>STOK READY (BARU)</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {hardwareBaru} Unit | {materialBaru}m
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>Kondisi Baru (100%)</p>
          </div>
        </div>

        {/* Card 3: Total Siap Pakai */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>SIAP PAKAI (TOTAL)</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {hardwareSiapPakai} Unit | {materialSiapPakai}m
            </div>
            <p style={{ fontSize: '0.7rem', color: '#1D4ED8', margin: '3px 0 0 0', fontWeight: 500 }}>Baru + Cabutan Normal</p>
          </div>
        </div>

        {/* Card 4: Stok Menipis */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>STOK MENIPIS (≤5)</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: lowStockCount > 0 ? '#FEF2F2' : '#F8FAFC', color: lowStockCount > 0 ? '#EF4444' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: lowStockCount > 0 ? '#EF4444' : '#152C4A', letterSpacing: '-0.02em' }}>
              {lowStockCount} SKU
            </div>
            <p style={{ fontSize: '0.7rem', color: lowStockCount > 0 ? '#DC2626' : '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Perlu Pengadaan Ulang</p>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Table Toolbar Search */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari nama aset, merk, atau tipe..." 
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
                backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '950px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA ASET</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>MERK</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TIPE</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>TOTAL MASUK</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>TOTAL KELUAR</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>DI GUDANG</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>TERPASANG</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>RUSAK</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                    {searchQuery ? `Tidak ada aset yang cocok dengan pencarian "${searchQuery}"` : 'Belum ada data aset gudang.'}
                  </td>
                </tr>
              ) : (
                filteredAssets.map((row, idx) => {
                  const unitLabel = String(row.raw?.stock_type || '').toLowerCase().includes('meter') ? 'm' : (row.raw?.stock_type || 'Unit');
                  const avail = Number(row.raw?.available_stock) || 0;
                  const cabutan = Number(row.raw?.cabutan_stock) || 0;
                  const used = Number(row.raw?.used_stock) || 0;
                  const damaged = Number(row.raw?.damaged_stock) || 0;
                  const totalMasuk = row.raw?.total_stock ?? (avail + cabutan + used + damaged);
                  const totalKeluar = used;
                  const diGudang = avail + cabutan;
                  const terpasang = used;
                  const rusak = damaged;

                  return (
                    <tr key={row.id} style={{ borderBottom: idx === filteredAssets.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                      {/* 1. Nama Aset */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <button 
                          onClick={(e) => handleDetailClick(row, e)}
                          style={{ 
                            background: 'none', border: 'none', padding: 0, 
                            color: '#152C4A', fontWeight: 700, cursor: 'pointer', 
                            textAlign: 'left', fontSize: 'inherit', whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}
                        >
                          {row.name}
                        </button>
                      </td>

                      {/* 2. Merk */}
                      <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {row.merk || row.raw?.brand || '-'}
                      </td>

                      {/* 3. Tipe */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <StatusBadge status={row.type} />
                      </td>

                      {/* 4. Total Masuk */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {totalMasuk} {unitLabel}
                        </span>
                      </td>

                      {/* 5. Total Keluar */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {totalKeluar} {unitLabel}
                        </span>
                      </td>

                      {/* 6. Di Gudang */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {diGudang} {unitLabel}
                        </span>
                      </td>

                      {/* 7. Terpasang */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ backgroundColor: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {terpasang} {unitLabel}
                        </span>
                      </td>

                      {/* 8. Rusak */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {rusak > 0 ? (
                          <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {rusak} {unitLabel}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            0 {unitLabel}
                          </span>
                        )}
                      </td>

                      {/* 9. Aksi (Detail) */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={(e) => handleDetailClick(row, e)}
                            title="Lihat Detail & Riwayat Transaksi"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              backgroundColor: '#EFF8FC', color: '#2563EB',
                              border: '1px solid #D8E6F3', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
