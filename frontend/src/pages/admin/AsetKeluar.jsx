import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Search, Info, Users, ArrowUpRight, Package, Layers, 
  Eye, RefreshCw, ChevronLeft, ChevronRight, Download, Printer,
  User, ExternalLink, Loader2, Wrench
} from 'lucide-react';
import { DetailTransaksiModal } from '../../components/DetailTransaksiModal';
import { DetailPelangganModal } from '../../components/DetailPelangganModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export const AsetKeluar = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailAset, setSelectedDetailAset] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer Detail Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useDocumentTitle('Aset Keluar (Pemakaian) — FiberPulse');

  const fetchOutgoing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets/transactions?type=Keluar&t=' + Date.now());
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        const mapped = json.data.map((item, idx) => {
          const cust = item.customer || item.task?.customer;
          const custId = item.customer_id || item.task?.customer_id || (cust ? cust.id : null);
          const custName = item.customer_name && item.customer_name !== '-' ? item.customer_name : (cust ? cust.name : (item.notes?.includes('Otomatis') || item.notes?.includes('Terpasang') ? 'Pelanggan Operasional' : '-'));

          // Sanitize technician: strictly technician accounts, never admin
          const rawTechName = item.technician_name || item.technician?.name || '';
          const isTechNameAdmin = rawTechName.toLowerCase().includes('admin');
          const cleanTechName = (!isTechNameAdmin && rawTechName && rawTechName !== '-') ? rawTechName : 'Teknisi Lapangan';
          const techId = item.technician_id || item.technician?.id || 8;

          return {
            id: item.id || idx + 1,
            tanggal: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            name: item.asset_name || `Aset #${item.asset_id}`,
            type: item.asset_category || 'Serial',
            sn: item.serial_number || '—',
            year: item.year || item.tahun || null,
            tahun: item.year || item.tahun || null,
            qty: item.quantity || 1,
            status: item.status_label || item.status || (item.notes?.includes('Otomatis') || item.notes?.includes('Terpasang') || item.notes?.includes('Terpakai') || item.notes?.includes('Selesai') ? 'Terpasang' : 'Dibawa Teknisi'),
            pelanggan: custName,
            customerId: custId,
            customer: cust,
            teknisi: cleanTechName,
            technicianId: techId,
            technicianData: item.technician,
            raw: item
          };
        });
        setTransactions(mapped);
      }
    } catch (e) {
      console.log('Error fetching AsetKeluar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoing();
  }, []);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor!');
      return;
    }

    const toastId = toast.loading('Menyiapkan file Excel / CSV...');
    const columns = [
      { key: 'no', label: 'No' },
      { key: 'tanggal', label: 'Tanggal Keluar' },
      { key: 'name', label: 'Nama Perangkat / Material' },
      { key: 'type', label: 'Tipe' },
      { key: 'sn', label: 'Serial Number (SN)' },
      { key: 'qty', label: 'Jumlah' },
      { key: 'teknisi', label: 'Teknisi PIC' },
      { key: 'pelanggan', label: 'Pelanggan / Lokasi Pasang' },
      { key: 'status', label: 'Status Pengeluaran' }
    ];

    const exportRows = filteredData.map((item, idx) => ({
      no: idx + 1,
      tanggal: item.tanggal,
      name: item.name,
      type: item.type,
      sn: item.sn,
      qty: `${item.qty} ${isConsumable(item) ? 'Meter' : 'Unit'}`,
      teknisi: item.teknisi,
      pelanggan: item.pelanggan,
      status: item.status
    }));

    exportToExcel(exportRows, columns, `Laporan_Aset_Keluar_SGT_NET_${new Date().toISOString().split('T')[0]}`);
    toast.success('Laporan Aset Keluar berhasil diekspor ke Excel!', { id: toastId });
  };

  const handlePrintPDF = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk dicetak!');
      return;
    }

    const toastId = toast.loading('Menyiapkan dokumen Berita Acara PDF...');
    const columns = [
      { key: 'no', label: 'No' },
      { key: 'tanggal', label: 'Tanggal Keluar' },
      { key: 'name', label: 'Nama Perangkat / Material' },
      { key: 'sn', label: 'Serial Number (SN)' },
      { key: 'qty', label: 'Jumlah' },
      { key: 'teknisi', label: 'Teknisi PIC' },
      { key: 'pelanggan', label: 'Tujuan Pasang' }
    ];

    const printRows = filteredData.map((item, idx) => ({
      no: idx + 1,
      tanggal: item.tanggal,
      name: item.name,
      sn: item.sn,
      qty: `${item.qty} ${isConsumable(item) ? 'Meter' : 'Unit'}`,
      teknisi: item.teknisi,
      pelanggan: item.pelanggan
    }));

    const summaryCards = [
      { label: 'Total Item Keluar', value: `${filteredData.length} Transaksi` },
      { label: 'Hardware Terpasang', value: `${terpasangCount} Unit` },
      { label: 'Material Kabel FO', value: `${totalKeluarConsumable} Meter` }
    ];

    printReportDocument({
      title: 'BERITA ACARA PENGELUARAN DAN PEMAKAIAN MATERIAL',
      subtitle: 'Inventarisasi Fisik Pengeluaran & Pemakaian Perangkat FiberPulse Technologies Inc.',
      docNumber: `BAST-OUT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      summaryCards,
      columns,
      data: printRows,
      signature1Title: 'Dibuat Oleh (Admin Logistik)',
      signature2Title: 'Mengetahui (Head of Tech / OM)'
    });
    toast.success('Dokumen Berita Acara PDF siap dicetak / disimpan.', { id: toastId });
  };

  const filteredData = transactions.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && String(item.name).toLowerCase().includes(q)) ||
      (item.pelanggan && String(item.pelanggan).toLowerCase().includes(q)) ||
      (item.customerId && `pel-${item.customerId}`.includes(q)) ||
      (item.customerId && String(item.customerId).includes(q)) ||
      (item.teknisi && String(item.teknisi).toLowerCase().includes(q)) ||
      (item.technicianId && String(item.technicianId).includes(q)) ||
      (item.sn && String(item.sn).toLowerCase().includes(q)) ||
      (item.tanggal && String(item.tanggal).toLowerCase().includes(q)) ||
      (item.type && String(item.type).toLowerCase().includes(q)) ||
      (item.status && String(item.status).toLowerCase().includes(q)) ||
      (item.qty && String(item.qty).toLowerCase().includes(q)) ||
      (item.raw?.notes && String(item.raw.notes).toLowerCase().includes(q)) ||
      (item.raw?.asset_brand && String(item.raw.asset_brand).toLowerCase().includes(q))
    );
  });

  const isConsumable = (item) => {
    const text = `${item?.type || ''} ${item?.name || ''} ${item?.asset_unit || ''} ${item?.asset_category || ''}`.toLowerCase();
    return text.includes('kabel') || text.includes('fo') || text.includes('fiber') || text.includes('meter') || text.includes('roll') || text.includes('consumable') || text.includes('drop');
  };

  const terpasangCount = transactions.filter(t => t.status === 'Terpasang').length;
  const dibawaCount = transactions.filter(t => t.status === 'Dibawa Teknisi').length;
  const totalKeluarSatuan = transactions.filter(t => !isConsumable(t)).reduce((acc, curr) => acc + (Number(curr.qty) || 1), 0);
  const totalKeluarConsumable = transactions.filter(t => isConsumable(t)).reduce((acc, curr) => acc + (Number(curr.qty) || 1), 0);

  const handleDetailClick = (row, e) => {
    e.preventDefault();
    setSelectedDetailAset({
      id: row.raw?.asset_id || row.id,
      name: row.name,
      merk: row.raw?.asset_brand || 'General',
      type: row.type,
      qty: `${row.qty} ${isConsumable(row) ? 'Meter' : 'Unit'}`,
      raw: row.raw
    });
    setIsDetailModalOpen(true);
  };

  const normalizeCustomerData = (c) => {
    if (!c) return null;
    return {
      id: c.id,
      name: String(c.name || 'Pelanggan'),
      nik: String(c.nik || '-'),
      phone: String(c.phone || '-'),
      address: String(c.address || '-'),
      dusun: String(c.dusun || '-'),
      package: String(c.package_speed || c.package || '30 Mbps'),
      status: String(c.status || 'Aktif'),
      odp: c.odp?.name || (c.odp_id ? `ODP #${c.odp_id}` : '-'),
      port: c.odp_port ? `Port ${c.odp_port}` : '-',
      latitude: c.latitude,
      longitude: c.longitude,
      modem_sn: c.modem_sn || null,
      raw: c
    };
  };

  const handleCustomerClick = async (row, e) => {
    if (e) e.preventDefault();
    if (!row.pelanggan || row.pelanggan === '-' || row.pelanggan === 'Pelanggan Operasional') {
      toast('Transaksi ini merupakan pengeluaran untuk keperluan operasional umum.', { icon: 'ℹ️' });
      return;
    }

    setLoadingCustomer(true);
    const toastId = toast.loading('Memuat data detail pelanggan...');
    try {
      if (row.customer) {
        setSelectedCustomer(normalizeCustomerData(row.customer));
        setIsCustomerModalOpen(true);
        toast.dismiss(toastId);
        return;
      }

      let customerFound = null;
      if (row.customerId) {
        const res = await fetch(`/api/customers/${row.customerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            customerFound = data.data;
          }
        }
      }

      if (!customerFound) {
        const resAll = await fetch('/api/customers');
        if (resAll.ok) {
          const dataAll = await resAll.json();
          if (dataAll.success && Array.isArray(dataAll.data)) {
            customerFound = dataAll.data.find(c => 
              (c.name && c.name.toLowerCase().trim() === row.pelanggan.toLowerCase().trim()) ||
              String(c.id) === String(row.customerId)
            );
          }
        }
      }

      toast.dismiss(toastId);
      if (customerFound) {
        setSelectedCustomer(normalizeCustomerData(customerFound));
        setIsCustomerModalOpen(true);
      } else {
        toast.error(`Data pelanggan "${row.pelanggan}" tidak ditemukan di database CRM.`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Gagal memuat detail pelanggan.');
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === 'All' ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = itemsPerPage === 'All' 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modal Detail Transaksi */}
      <DetailTransaksiModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        data={selectedDetailAset} 
      />

      {/* Modal Detail Pelanggan */}
      <DetailPelangganModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        data={selectedCustomer} 
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
            Aset Keluar (Pemakaian Lapangan)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Pencatatan otomatis pemakaian perangkat ONT, STB, dan kabel FO berdasarkan penyelesaian tugas teknisi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchOutgoing} 
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
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleExportExcel}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #059669',
              color: '#059669',
              fontWeight: 700,
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
            <Download size={13} />
            <span>Ekspor Excel</span>
          </button>

          <button 
            onClick={handlePrintPDF}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #152C4A',
              color: '#152C4A',
              fontWeight: 700,
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
            <Printer size={13} />
            <span>Cetak PDF (BAST)</span>
          </button>
        </div>
      </div>
      
      {/* Alert Info Notice */}
      <div style={{ backgroundColor: '#F1F7FC', border: '1px solid #E2EBF4', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Info size={16} color="#2563EB" style={{ flexShrink: 0 }} />
        <p style={{ color: '#152C4A', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>
          <strong style={{ fontWeight: 700 }}>Informasi Otomatisasi:</strong> Data aset keluar terpotong otomatis dari penugasan instalasi & maintenance teknisi.
        </p>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Terpasang Pelanggan */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TERPASANG PELANGGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
              {terpasangCount} Lokasi
            </div>
            <p style={{ fontSize: '0.7rem', color: '#047857', margin: '3px 0 0 0', fontWeight: 500 }}>Aktif Terpasang di Rumah</p>
          </div>
        </div>

        {/* Card 2: Dibawa Teknisi */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>DIBAWA TEKNISI</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em' }}>
              {dibawaCount} Item
            </div>
            <p style={{ fontSize: '0.7rem', color: '#B45309', margin: '3px 0 0 0', fontWeight: 500 }}>Dalam Bagasi Lapangan</p>
          </div>
        </div>

        {/* Card 3: Keluar Perangkat */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>KELUAR PERANGKAT</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {totalKeluarSatuan} Unit
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>ONT, Router, & STB</p>
          </div>
        </div>

        {/* Card 4: Keluar Material FO */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>KELUAR MATERIAL FO</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {totalKeluarConsumable} Meter
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>Dropcore & Patchcord FO</p>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Table Toolbar Search */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari barang, SN, atau nama pelanggan..." 
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
            Total: <span style={{ color: '#152C4A', fontWeight: 800 }}>{filteredData.length}</span> Data Transaksi
          </div>
        </div>

        {/* Data Table */}
        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '950px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TANGGAL</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA BARANG</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TIPE</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>SERIAL NUMBER (SN)</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>QTY KELUAR</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>PELANGGAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TEKNISI</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                    Belum ada transaksi aset keluar yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.tanggal}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.name}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}><StatusBadge status={row.type} /></td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.sn}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.qty} <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>{String(row.qty).toLowerCase().includes('meter') || String(row.qty).toLowerCase().includes('unit') ? '' : (isConsumable(row) ? 'Meter' : 'Unit')}</span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        backgroundColor: row.status === 'Terpasang' ? '#ECFDF5' : '#FFFBEB', 
                        color: row.status === 'Terpasang' ? '#059669' : '#D97706', 
                        border: `1px solid ${row.status === 'Terpasang' ? '#A7F3D0' : '#FDE68A'}`,
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        <div style={{ width: 5, height: 5, backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.pelanggan && row.pelanggan !== '-' ? (
                        <a 
                          href={`/admin/pelanggan?${row.customerId ? `id=${row.customerId}` : `search=${encodeURIComponent(row.pelanggan)}`}`}
                          onClick={(e) => handleCustomerClick(row, e)}
                          title={`Buka detail data pelanggan ${row.pelanggan}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            color: '#2563EB', fontWeight: 700, fontSize: '0.75rem',
                            textDecoration: 'none', cursor: 'pointer',
                            padding: '3px 8px', borderRadius: '6px',
                            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DBEAFE'; e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          <User size={12} color="#2563EB" />
                          <span>{row.pelanggan}</span>
                          {row.customerId && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1D4ED8', backgroundColor: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #BFDBFE', textDecoration: 'none' }}>
                              PEL-{row.customerId}
                            </span>
                          )}
                          <ExternalLink size={11} color="#2563EB" style={{ textDecoration: 'none' }} />
                        </a>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.teknisi && row.teknisi !== '-' ? (
                        <a
                          href={`/admin/manajemen-akun?search=${encodeURIComponent(row.teknisi)}`}
                          title={`Lihat akun teknisi bertugas (${row.teknisi})`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            color: '#0F766E', fontWeight: 700, fontSize: '0.75rem',
                            textDecoration: 'none', cursor: 'pointer',
                            padding: '3px 8px', borderRadius: '6px',
                            backgroundColor: '#F0FDFA', border: '1px solid #99F6E4',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#CCFBF1'; e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0FDFA'; e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          <Wrench size={11} color="#0D9488" />
                          <span>{row.teknisi}</span>
                          {row.technicianId && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0F766E', backgroundColor: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #99F6E4', textDecoration: 'none' }}>
                              ID: {row.technicianId}
                            </span>
                          )}
                        </a>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <button 
                        onClick={(e) => handleDetailClick(row, e)}
                        title="Lihat Rincian & Riwayat Gudang"
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
