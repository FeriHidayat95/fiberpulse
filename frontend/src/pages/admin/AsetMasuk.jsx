import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Search, Eye, Edit, Trash2, RefreshCw, Plus, 
  ArrowDownLeft, Package, CheckCircle2, Layers, ChevronLeft, ChevronRight,
  ShieldCheck, AlertTriangle, Check, User, MapPin, Radio, HardDrive, FileSpreadsheet, Printer
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TambahAsetModal } from '../../components/TambahAsetModal';
import { TambahStokModal } from '../../components/TambahStokModal';
import { EditAsetMasukModal } from '../../components/EditAsetMasukModal';
import { DetailTransaksiModal } from '../../components/DetailTransaksiModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';

export const AsetMasuk = () => {
  const [activeTab, setActiveTab] = useState('riwayat'); // 'riwayat' | 'handover'
  const [isModalAsetOpen, setIsModalAsetOpen] = useState(false);
  const [isModalStokOpen, setIsModalStokOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEditData, setSelectedEditData] = useState(null);
  const [selectedDetailAset, setSelectedDetailAset] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Role-based Access Control
  const userRole = (localStorage.getItem('user_role') || '').toLowerCase().trim();
  const isGudangAdmin = ['admin_gudang', 'kepala_gudang', 'admin', 'admin gudang', 'kepala teknisi gudang', 'super admin', 'administrator'].includes(userRole);

  const handleOpenTambahAset = () => {
    if (!isGudangAdmin) {
      toast.error('Akses Dibatasi: Input aset masuk hanya dapat dilakukan oleh akun dengan peran Admin Gudang atau Kepala Teknisi Gudang.', { duration: 4500 });
      return;
    }
    setIsModalAsetOpen(true);
  };

  const handleOpenTambahStok = () => {
    if (!isGudangAdmin) {
      toast.error('Akses Dibatasi: Input penambahan stok masuk hanya dapat dilakukan oleh akun dengan peran Admin Gudang atau Kepala Teknisi Gudang.', { duration: 4500 });
      return;
    }
    setIsModalStokOpen(true);
  };
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const queryClient = useQueryClient();
  useDocumentTitle('Aset Masuk & Serah Terima — FiberPulse');

  // Query 1: Riwayat Stok Masuk
  const { data: transactions = [], isLoading: loadingTx, refetch: fetchTransactions } = useQuery({
    queryKey: ['aset-masuk'],
    queryFn: async () => {
      const res = await fetch('/api/assets/transactions?type=Masuk&t=' + Date.now());
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((item, idx) => {
          const assetName = item.asset_name || item.asset?.name || `Aset #${item.asset_id || idx + 1}`;
          const assetBrand = item.asset_brand || item.asset?.brand || 'General';
          const assetCategory = item.asset_category || item.asset?.category || 'Serial';
          const assetStockType = item.asset_unit || item.asset_type || item.asset?.stock_type || 'Unit';

          const isConsumable = 
            assetCategory === 'Consumable' || 
            assetCategory === 'Non-Serial' || 
            String(assetStockType).toLowerCase().includes('meter') || 
            String(assetStockType).toLowerCase().includes('roll') || 
            String(assetName).toLowerCase().includes('kabel') ||
            String(assetName).toLowerCase().includes('drop') ||
            String(assetName).toLowerCase().includes('pigtail') ||
            String(assetName).toLowerCase().includes('connector');
          
          const badgeType = isConsumable ? 'Consumable' : 'Serial';
          const unitLabel = assetStockType || (isConsumable ? 'Meter' : 'Unit');
          
          return {
            id: item.id || idx + 1,
            name: assetName,
            merk: assetBrand,
            type: badgeType,
            tanggal: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            jumlah: `${item.quantity} ${unitLabel}`,
            serial_number: item.serial_number || item.asset_serial || null,
            year: item.year || item.tahun || null,
            tahun: item.year || item.tahun || null,
            raw: item
          };
        });
      }
      return [];
    }
  });

  // Query 2: Pending Handovers from Technicians
  const { data: pendingHandovers = [], isLoading: loadingHandovers, refetch: fetchHandovers } = useQuery({
    queryKey: ['pending-handovers'],
    queryFn: async () => {
      const res = await fetch('/api/assets/pending-handovers?t=' + Date.now());
      if (!res.ok) return [];
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    }
  });

  // Action: Terima Serah Terima Handover ke Gudang
  const receiveHandoverMutation = useMutation({
    mutationFn: async ({ transactionId, condition }) => {
      const res = await fetch('/api/assets/receive-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          condition: condition,
          notes: `Diterima dan diverifikasi kondisi ${condition} oleh Admin Logistik`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memproses serah terima');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Perangkat berhasil diterima di gudang!');
      queryClient.invalidateQueries({ queryKey: ['pending-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['assets-gudang'] });
      queryClient.invalidateQueries({ queryKey: ['aset-masuk'] });
    },
    onError: (err) => {
      toast.error('Gagal: ' + err.message);
    }
  });

  const handleReceiveClick = (item, condition) => {
    const label = condition === 'Baik' ? 'Layak Pakai (Stok Cabutan RTS)' : 'Rusak / Cacat (Stok Scrap)';
    if (window.confirm(`Verifikasi serah terima perangkat SN "${item.serial_number}" dari Teknisi ${item.technician_name} sebagai ${label}?`)) {
      receiveHandoverMutation.mutate({ transactionId: item.id, condition });
    }
  };

  const handleSaveNewAsset = () => {
    fetchTransactions();
    queryClient.invalidateQueries({ queryKey: ['assets-gudang'] });
    queryClient.invalidateQueries({ queryKey: ['aset-masuk'] });
    setIsModalAsetOpen(false);
  };

  const handleSaveNewStock = () => {
    fetchTransactions();
    queryClient.invalidateQueries({ queryKey: ['assets-gudang'] });
    queryClient.invalidateQueries({ queryKey: ['aset-masuk'] });
    setIsModalStokOpen(false);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/assets/transactions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menghapus');
      return data;
    },
    onSuccess: () => {
      toast.success('Transaksi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['aset-masuk'] });
      queryClient.invalidateQueries({ queryKey: ['assets-gudang'] });
    },
    onError: (err) => {
      toast.error('Gagal: ' + err.message);
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini? Stok master gudang juga akan disesuaikan.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (row, e) => {
    e.stopPropagation();
    setSelectedEditData(row.raw);
    setIsEditModalOpen(true);
  };

  const handleDetailClick = (row, e) => {
    e.stopPropagation();
    setSelectedDetailAset({
      id: row.raw?.asset_id || row.id,
      name: row.name,
      merk: row.merk,
      type: row.type,
      qty: row.jumlah,
      raw: row.raw
    });
    setIsDetailModalOpen(true);
  };

  const filteredData = transactions.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.name && String(t.name).toLowerCase().includes(q)) ||
      (t.merk && String(t.merk).toLowerCase().includes(q)) ||
      (t.type && String(t.type).toLowerCase().includes(q)) ||
      (t.serial_number && String(t.serial_number).toLowerCase().includes(q)) ||
      (t.tanggal && String(t.tanggal).toLowerCase().includes(q)) ||
      (t.tahun && String(t.tahun).toLowerCase().includes(q)) ||
      (t.kategori && String(t.kategori).toLowerCase().includes(q)) ||
      (t.quantity && String(t.quantity).toLowerCase().includes(q)) ||
      (t.unit && String(t.unit).toLowerCase().includes(q)) ||
      (t.notes && String(t.notes).toLowerCase().includes(q)) ||
      (t.raw?.technician_name && String(t.raw.technician_name).toLowerCase().includes(q)) ||
      (t.raw?.customer_name && String(t.raw.customer_name).toLowerCase().includes(q))
    );
  });

  const filteredHandovers = pendingHandovers.filter(h => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (h.technician_name && String(h.technician_name).toLowerCase().includes(q)) ||
      (h.customer_name && String(h.customer_name).toLowerCase().includes(q)) ||
      (h.customer_dusun && String(h.customer_dusun).toLowerCase().includes(q)) ||
      (h.customer_address && String(h.customer_address).toLowerCase().includes(q)) ||
      (h.serial_number && String(h.serial_number).toLowerCase().includes(q)) ||
      (h.asset_name && String(h.asset_name).toLowerCase().includes(q)) ||
      (h.notes && String(h.notes).toLowerCase().includes(q)) ||
      (h.created_at && String(h.created_at).toLowerCase().includes(q))
    );
  });

  const totalRestockCount = transactions.length;
  const newStockTransactions = transactions.filter(t => t.raw?.technician_id == null).length;
  const pendingCount = pendingHandovers.length;

  // Handler: Export to Excel / CSV
  const handleExportExcel = () => {
    if (activeTab === 'riwayat') {
      if (filteredData.length === 0) {
        toast.error('Tidak ada data transaksi masuk untuk diekspor.');
        return;
      }
      const toastId = toast.loading('Menyiapkan file Excel Transaksi Masuk...');
      const headers = ['No', 'Nama Aset', 'Merk', 'Tipe', 'Tanggal Masuk', 'Jumlah', 'Serial Number', 'Sumber'];
      const rows = filteredData.map((row, idx) => [
        idx + 1,
        row.name,
        row.merk || 'General',
        row.type,
        row.tanggal,
        row.jumlah,
        row.serial_number || '-',
        row.raw?.technician_id ? 'Tarikan Teknisi' : 'Pengadaan Baru'
      ]);
      exportToExcel('Rekapitulasi_Aset_Masuk_SGT', headers, rows);
      toast.success('File Excel / CSV berhasil diunduh.', { id: toastId });
    } else {
      if (filteredHandovers.length === 0) {
        toast.error('Tidak ada data serah terima untuk diekspor.');
        return;
      }
      const toastId = toast.loading('Menyiapkan file Excel Serah Terima...');
      const headers = ['No', 'Tanggal Tarik', 'Teknisi', 'Pelanggan Asal', 'Dusun', 'Nama Perangkat', 'Serial Number', 'Adaptor', 'Kondisi'];
      const rows = filteredHandovers.map((h, idx) => [
        idx + 1,
        h.pulled_at || (h.created_at ? h.created_at.split('T')[0] : '-'),
        h.technician_name || '-',
        h.customer_name || '-',
        h.customer_dusun || '-',
        `${h.asset_name || 'Modem'} (${h.asset_brand || 'General'})`,
        h.serial_number || '-',
        h.has_adaptor ? 'Lengkap' : 'Tidak Ada',
        h.condition === 'Baik' ? 'Baik (Layak Pakai)' : 'Rusak / Cacat'
      ]);
      exportToExcel('Rekapitulasi_Serah_Terima_Teknisi_SGT', headers, rows);
      toast.success('File Excel / CSV berhasil diunduh.', { id: toastId });
    }
  };

  // Handler: Print Formal PDF Document
  const handlePrintPDF = () => {
    if (activeTab === 'riwayat') {
      if (filteredData.length === 0) {
        toast.error('Tidak ada data transaksi untuk dicetak.');
        return;
      }
      const toastId = toast.loading('Menyiapkan dokumen Berita Acara PDF...');
      const headers = ['No', 'Nama Aset / Perangkat', 'Merk', 'Tipe', 'Tanggal Masuk', 'Jumlah Restock', 'Serial Number', 'Sumber'];
      const rows = filteredData.map((row, idx) => [
        idx + 1,
        `<strong>${row.name}</strong>`,
        row.merk || 'General',
        row.type,
        row.tanggal,
        `<strong>+${row.jumlah}</strong>`,
        row.serial_number || '-',
        row.raw?.technician_id ? 'Tarikan Teknisi' : 'Pengadaan Baru'
      ]);
      const summaryCards = [
        { label: 'Total Transaksi Masuk', value: `${transactions.length} Log` },
        { label: 'Pengadaan Supplier', value: `${newStockTransactions} Transaksi` },
        { label: 'Cabutan Teknisi', value: `${transactions.length - newStockTransactions} Transaksi` }
      ];

      printReportDocument({
        title: 'BERITA ACARA PENERIMAAN & RESTOCK ASET GUDANG',
        subtitle: 'Log Penerimaan Perangkat & Material Logistik FiberPulse Technologies Inc.',
        docNumber: `BAP-LOG-${Date.now().toString().slice(-6)}`,
        summaryCards,
        headers,
        rows,
        notes: 'Dokumen ini merupakan catatan resmi penerimaan aset masuk ke gudang operasional FiberPulse.'
      });
      toast.success('Dokumen PDF siap dicetak / disimpan.', { id: toastId });
    } else {
      if (filteredHandovers.length === 0) {
        toast.error('Tidak ada data serah terima untuk dicetak.');
        return;
      }
      const toastId = toast.loading('Menyiapkan Berita Acara Serah Terima PDF...');
      const headers = ['No', 'Tanggal Tarik', 'Teknisi Pembawa', 'Pelanggan Asal (Dusun)', 'Nama Perangkat', 'Serial Number', 'Adaptor', 'Kondisi'];
      const rows = filteredHandovers.map((h, idx) => [
        idx + 1,
        h.pulled_at || (h.created_at ? h.created_at.split('T')[0] : '-'),
        h.technician_name || '-',
        `${h.customer_name || '-'} (${h.customer_dusun || '-'})`,
        `${h.asset_name || 'Modem'} (${h.asset_brand || 'General'})`,
        h.serial_number || '-',
        h.has_adaptor ? '✓ Lengkap' : '✗ Tidak Ada',
        h.condition === 'Baik' ? 'Baik' : 'Rusak'
      ]);
      const summaryCards = [
        { label: 'Total Menunggu Verifikasi', value: `${pendingHandovers.length} Unit` }
      ];

      printReportDocument({
        title: 'BERITA ACARA SERAH TERIMA MODEM CABUTAN LAPANGAN',
        subtitle: 'Verifikasi Fisik Tarikan Teknisi ke Gudang FiberPulse Technologies Inc.',
        docNumber: `BAST-CAB-${Date.now().toString().slice(-6)}`,
        summaryCards,
        headers,
        rows,
        notes: 'Dokumen ini mencatat seluruh perangkat tarikan dari rumah pelanggan yang diserahkan oleh teknisi ke gudang.'
      });
      toast.success('Dokumen Berita Acara PDF siap dicetak / disimpan.', { id: toastId });
    }
  };

  // Pagination logic for Tab 1
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === 'All' ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = itemsPerPage === 'All' 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modals */}
      <TambahAsetModal 
        isOpen={isModalAsetOpen} 
        onClose={() => { setIsModalAsetOpen(false); fetchTransactions(); }} 
        onSave={handleSaveNewAsset}
      />
      <TambahStokModal 
        isOpen={isModalStokOpen} 
        onClose={() => { setIsModalStokOpen(false); fetchTransactions(); }} 
        onSave={handleSaveNewStock}
      />
      <EditAsetMasukModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={() => {
          fetchTransactions();
          setIsEditModalOpen(false);
        }}
        transactionData={selectedEditData}
      />
      <DetailTransaksiModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        data={selectedDetailAset} 
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
            Aset Masuk (Penerimaan & Restock)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Pencatatan restock barang supplier dan verifikasi serah terima modem cabutan dari teknisi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
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

          <button 
            onClick={handlePrintPDF}
            title="Cetak Berita Acara Penerimaan"
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

          <button 
            onClick={() => { fetchTransactions(); fetchHandovers(); }} 
            disabled={loadingTx || loadingHandovers}
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
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <RefreshCw size={13} className={loadingTx ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleOpenTambahAset}
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
            title={isGudangAdmin ? 'Tambah Master Aset Baru' : 'Akses dibatasi: Khusus Admin Gudang / Kepala Teknisi Gudang'}
          >
            <Plus size={13} />
            <span>Tambah Aset</span>
          </button>

          <button 
            onClick={handleOpenTambahStok}
            className={isGudangAdmin ? 'sgt-btn-primary' : ''}
            style={{
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isGudangAdmin ? 'pointer' : 'not-allowed',
              border: isGudangAdmin ? 'none' : '1px solid #CBD5E1',
              backgroundColor: isGudangAdmin ? undefined : '#F1F5F9',
              color: isGudangAdmin ? undefined : '#94A3B8',
              opacity: isGudangAdmin ? 1 : 0.7
            }}
            title={isGudangAdmin ? 'Tambah Stok Aset Masuk' : 'Akses dibatasi: Khusus Admin Gudang / Kepala Teknisi Gudang'}
          >
            <Plus size={13} />
            <span>Tambah Stok</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Total Transaksi Masuk */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TOTAL RESTOCK GUDANG</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#152C4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {totalRestockCount} Transaksi
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Total Log Barang Masuk</p>
          </div>
        </div>

        {/* Card 2: Menunggu Serah Terima (Pending Handover) */}
        <div 
          onClick={() => setActiveTab('handover')}
          style={{ 
            backgroundColor: pendingCount > 0 ? '#FEF2F2' : '#FFFFFF', 
            padding: '1rem 1.1rem', 
            borderRadius: '12px', 
            border: pendingCount > 0 ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: pendingCount > 0 ? '#B91C1C' : '#94A3B8' }}>MENUNGGU SERAH TERIMA</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: pendingCount > 0 ? '#FEE2E2' : '#EFF6FF', color: pendingCount > 0 ? '#DC2626' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pendingCount > 0 ? '#DC2626' : '#152C4A', letterSpacing: '-0.02em' }}>
              {pendingCount} Unit
            </div>
            <p style={{ fontSize: '0.7rem', color: pendingCount > 0 ? '#B91C1C' : '#64748B', margin: '3px 0 0 0', fontWeight: 600 }}>
              {pendingCount > 0 ? 'Klik untuk verifikasi penerimaan ➔' : 'Semua tarikan sudah diterima'}
            </p>
          </div>
        </div>

        {/* Card 3: Hasil Cabutan Terverifikasi */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>STOK BARU SUPPLIER</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
              {newStockTransactions} Batch
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>Pengadaan Segel Baru</p>
          </div>
        </div>

      </div>

      {/* Main Table Card with Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Tab Selector & Search Toolbar */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFCFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('riwayat')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'riwayat' ? '#152C4A' : '#EFF6FF',
                color: activeTab === 'riwayat' ? '#FFFFFF' : '#2563EB',
                transition: 'all 0.15s ease'
              }}
            >
              Riwayat Restock ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('handover')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'handover' ? (pendingCount > 0 ? '#DC2626' : '#152C4A') : (pendingCount > 0 ? '#FEE2E2' : '#EFF6FF'),
                color: activeTab === 'handover' ? '#FFFFFF' : (pendingCount > 0 ? '#DC2626' : '#2563EB'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Serah Terima Tarikan Teknisi</span>
              {pendingCount > 0 && (
                <span style={{ backgroundColor: activeTab === 'handover' ? '#FFFFFF' : '#DC2626', color: activeTab === 'handover' ? '#DC2626' : '#FFFFFF', padding: '1px 6px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder={activeTab === 'riwayat' ? "Cari nama aset, merk, serial..." : "Cari nama teknisi, pelanggan, SN..."} 
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
                backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {/* Tab 1: Riwayat Restock Table */}
        {activeTab === 'riwayat' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '950px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>NAMA ASET</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>MERK</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>TIPE</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>TANGGAL MASUK</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>JUMLAH RESTOCK</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>SERIAL NUMBER</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>SUMBER</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                      {searchQuery ? `Tidak ada transaksi yang cocok dengan "${searchQuery}"` : 'Belum ada transaksi aset masuk.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr 
                      key={row.id} 
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease', cursor: 'pointer' }}
                      onClick={(e) => handleDetailClick(row, e)}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {row.merk}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                          backgroundColor: row.type === 'Serial' ? '#EFF6FF' : '#F1F5F9',
                          color: row.type === 'Serial' ? '#2563EB' : '#475569'
                        }}>
                          {row.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace' }}>
                        {row.tanggal}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                        +{row.jumlah}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {row.serial_number ? (
                          <span style={{ backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.7rem', color: '#152C4A', border: '1px solid #E2E8F0' }}>
                            {row.serial_number}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: row.raw?.technician_id ? '#FFFBEB' : '#ECFDF5',
                          color: row.raw?.technician_id ? '#B45309' : '#047857'
                        }}>
                          {row.raw?.technician_id ? 'Tarikan Teknisi' : 'Pengadaan Baru'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button 
                            onClick={(e) => handleDetailClick(row, e)}
                            style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', cursor: 'pointer' }}
                            title="Lihat Detail"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={(e) => handleEditClick(row, e)}
                            style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#2563EB', cursor: 'pointer' }}
                            title="Edit"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                            style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Serah Terima Tarikan Teknisi Table */}
        {activeTab === 'handover' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '950px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>TANGGAL TARIK</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>TEKNISI PEMBAWA</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>PELANGGAN ASAL (DUSUN)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>NAMA PERANGKAT</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>SERIAL NUMBER (SN)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>ADAPTOR 12V</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>KONDISI FISIK</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>VERIFIKASI SERAH TERIMA GUDANG</th>
                </tr>
              </thead>
              <tbody>
                {filteredHandovers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94A3B8' }}>
                      <ShieldCheck size={32} color="#059669" style={{ margin: '0 auto 8px auto' }} />
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.85rem' }}>Tidak Ada Barang Tertahan di Teknisi</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Seluruh modem hasil pencabutan lapangan sudah diserahterimakan ke gudang.</div>
                    </td>
                  </tr>
                ) : (
                  filteredHandovers.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFDFD' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#64748B' }}>
                        {item.pulled_at}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} color="#2563EB" />
                          <span>{item.technician_name}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Tiket: {item.ticket_number}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{item.customer_name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} color="#3B82F6" />
                          <span>{item.customer_dusun}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A' }}>
                        {item.asset_name} ({item.asset_brand})
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', color: '#152C4A', border: '1px solid #E2E8F0' }}>
                          {item.serial_number}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                          backgroundColor: item.has_adaptor ? '#ECFDF5' : '#FEF2F2',
                          color: item.has_adaptor ? '#059669' : '#DC2626'
                        }}>
                          {item.has_adaptor ? '✓ Lengkap' : '✗ Tidak Ada'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800,
                          backgroundColor: item.condition === 'Baik' ? '#DCFCE7' : '#FEE2E2',
                          color: item.condition === 'Baik' ? '#047857' : '#B91C1C'
                        }}>
                          ● {item.condition === 'Baik' ? 'Baik (Layak Pakai)' : 'Rusak / Cacat'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleReceiveClick(item, 'Baik')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 3px rgba(5,150,105,0.25)'
                            }}
                          >
                            <Check size={12} /> Terima RTS (Baik)
                          </button>
                          <button
                            onClick={() => handleReceiveClick(item, 'Rusak')}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <AlertTriangle size={11} /> Terima Rusak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {activeTab === 'riwayat' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748B' }}>
              <span>Menampilkan {paginatedData.length} dari {filteredData.length} data</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.75rem', backgroundColor: 'white', color: '#152C4A' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="All">Semua</option>
              </select>
            </div>

            {itemsPerPage !== 'All' && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: currentPage === 1 ? '#F1F5F9' : 'white', color: currentPage === 1 ? '#94A3B8' : '#152C4A', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', padding: '0 6px' }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: currentPage === totalPages ? '#F1F5F9' : 'white', color: currentPage === totalPages ? '#94A3B8' : '#152C4A', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
