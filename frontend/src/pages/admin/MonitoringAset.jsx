import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Eye, HardDrive, ArrowDownLeft, ArrowUpRight, 
  Wifi, User, MapPin, Radio, ShieldCheck, FileSpreadsheet, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DetailMonitoringAsetModal } from '../../components/DetailMonitoringAsetModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { exportToExcel } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export const MonitoringAset = () => {
  const [selectedAset, setSelectedAset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pelanggan'); // 'pelanggan' | 'siklus'
  const [loading, setLoading] = useState(false);

  // Data states
  const [customersWithModem, setCustomersWithModem] = useState([]);
  const [assetsLifecycle, setAssetsLifecycle] = useState([]);

  useDocumentTitle('Pelacakan Aset Terpasang — FiberPulse');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCust, resAssets] = await Promise.all([
        fetch('/api/customers?t=' + Date.now()).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/assets?t=' + Date.now()).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      // 1. Process Customers with Installed Modems
      const custList = Array.isArray(resCust.data) ? resCust.data : (Array.isArray(resCust) ? resCust : []);
      const installedModems = custList.filter(c => c.status === 'Aktif' || c.status === 'Isolir' || c.modem_sn);
      setCustomersWithModem(installedModems);

      // 2. Process Lifecycle Assets
      const rawAssets = Array.isArray(resAssets.data) ? resAssets.data : (Array.isArray(resAssets) ? resAssets : []);
      const mappedAssets = rawAssets.map(item => {
        const unit = item.stock_type || 'Unit';
        const isMeter = String(unit).toLowerCase().includes('meter');
        return {
          id: item.id,
          nama: item.name || 'Aset #' + item.id,
          merk: item.brand || 'General',
          tipe: item.category || 'Perangkat',
          unit: isMeter ? 'Meter' : 'Unit',
          totalMasuk: item.total_stock || 0,
          terpasang: item.used_stock || 0,
          readyGudang: item.available_stock || 0,
          cabutanRts: item.cabutan_stock || 0,
          rusakScrap: item.damaged_stock || 0,
          raw: item
        };
      });
      setAssetsLifecycle(mappedAssets);
    } catch (e) {
      console.error('Failed fetching monitoring data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (item) => {
    setSelectedAset(item);
    setIsModalOpen(true);
  };

  // Filter for Tab 1 (Installed Customers)
  const filteredCustomers = customersWithModem.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && String(c.name).toLowerCase().includes(q)) ||
      (c.phone && String(c.phone).toLowerCase().includes(q)) ||
      (c.dusun && String(c.dusun).toLowerCase().includes(q)) ||
      (c.address && String(c.address).toLowerCase().includes(q)) ||
      (c.modem_sn && String(c.modem_sn).toLowerCase().includes(q)) ||
      (c.odp?.name && String(c.odp.name).toLowerCase().includes(q)) ||
      (c.odp_port && String(c.odp_port).includes(q)) ||
      (c.package_speed && String(c.package_speed).toLowerCase().includes(q)) ||
      (c.package && String(c.package).toLowerCase().includes(q)) ||
      (c.status && String(c.status).toLowerCase().includes(q))
    );
  });

  // Filter for Tab 2 (Lifecycle)
  const filteredLifecycle = assetsLifecycle.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.nama && String(a.nama).toLowerCase().includes(q)) ||
      (a.merk && String(a.merk).toLowerCase().includes(q)) ||
      (a.tipe && String(a.tipe).toLowerCase().includes(q)) ||
      (a.unit && String(a.unit).toLowerCase().includes(q)) ||
      (a.totalMasuk && String(a.totalMasuk).includes(q)) ||
      (a.terpasang && String(a.terpasang).includes(q)) ||
      (a.readyGudang && String(a.readyGudang).includes(q)) ||
      (a.cabutanRts && String(a.cabutanRts).includes(q)) ||
      (a.rusakScrap && String(a.rusakScrap).includes(q))
    );
  });

  // Export Excel
  const handleExport = () => {
    if (activeTab === 'pelanggan') {
      if (filteredCustomers.length === 0) {
        toast.error('Tidak ada data perangkat terpasang untuk diekspor.');
        return;
      }
      const headers = ['No', 'Nama Pelanggan', 'No. WhatsApp', 'Wilayah / Dusun', 'Alokasi ODP', 'Port ODP', 'Serial Number (SN) Modem', 'Paket Layanan', 'Status'];
      const rows = filteredCustomers.map((c, idx) => [
        idx + 1,
        c.name,
        c.phone,
        c.dusun || c.address,
        c.odp?.name || 'ODP-SLG-01',
        `Port ${c.odp_port || 1}`,
        c.modem_sn || 'ZTE-F670L-INSTALLED',
        c.package_speed || c.package || '20 Mbps',
        c.status || 'Aktif'
      ]);
      exportToExcel('Pelacakan_Modem_Terpasang_Pelanggan', headers, rows);
    } else {
      if (filteredLifecycle.length === 0) {
        toast.error('Tidak ada data siklus aset untuk diekspor.');
        return;
      }
      const headers = ['No', 'Nama Aset', 'Merk', 'Tipe', 'Total Masuk', 'Total Keluar', 'Di Gudang', 'Terpasang', 'Rusak', 'Satuan'];
      const rows = filteredLifecycle.map((a, idx) => {
        const diGudang = (a.readyGudang || 0) + (a.cabutanRts || 0);
        return [
          idx + 1,
          a.nama,
          a.merk,
          a.tipe,
          a.totalMasuk,
          a.terpasang, // Total Keluar
          diGudang,    // Di Gudang
          a.terpasang, // Terpasang
          a.rusakScrap,// Rusak
          a.unit
        ];
      });
      exportToExcel('Audit_Siklus_Hidup_Aset_SGT', headers, rows);
    }
    toast.success('File Excel berhasil diunduh.');
  };

  const totalModemTerpasang = customersWithModem.length;
  const totalModemReady = assetsLifecycle
    .filter(a => a.unit === 'Unit')
    .reduce((sum, a) => sum + (a.readyGudang || 0), 0);
  const totalModemCabutan = assetsLifecycle
    .filter(a => a.unit === 'Unit')
    .reduce((sum, a) => sum + (a.cabutanRts || 0), 0);
  const totalModemRusak = assetsLifecycle
    .filter(a => a.unit === 'Unit')
    .reduce((sum, a) => sum + (a.rusakScrap || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      <DetailMonitoringAsetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedAset}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: '#152C4A', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FIELD ASSET TRACKING
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
            Pelacakan Aset Terpasang (Asset Tracking)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Pelacakan posisi perangkat ONT/Modem di rumah pelanggan, nomor seri aktif, dan audit siklus hidup aset.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExport}
            title="Unduh Data ke Excel"
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
            onClick={fetchData} 
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
        </div>
      </div>

      {/* 4 KPI Lifecycle Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Terpasang di Pelanggan */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>TERPASANG DI PELANGGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A' }}>
            {totalModemTerpasang} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Unit</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>Modem Aktif di Rumah User</div>
        </div>

        {/* Card 2: Ready di Gudang */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>READY DI GUDANG</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
            {totalModemReady} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Unit</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Stok Baru Siap Pasang</div>
        </div>

        {/* Card 3: Cabutan (RTS) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>CABUTAN / RTS</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
            {totalModemCabutan} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Unit</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 600, marginTop: '2px' }}>Ditarik Layak Pakai</div>
        </div>

        {/* Card 4: Rusak / Scrap */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>RUSAK / SCRAP</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>
            {totalModemRusak} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Unit</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>Menunggu Pemusnahan</div>
        </div>

      </div>

      {/* Main Card with Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        {/* Tab & Search Bar Header */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#FAFCFF' }}>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('pelanggan')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'pelanggan' ? '#152C4A' : '#EFF6FF',
                color: activeTab === 'pelanggan' ? '#FFFFFF' : '#2563EB',
                transition: 'all 0.15s ease'
              }}
            >
              Perangkat Aktif di Pelanggan ({customersWithModem.length})
            </button>
            <button
              onClick={() => setActiveTab('siklus')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'siklus' ? '#152C4A' : '#EFF6FF',
                color: activeTab === 'siklus' ? '#FFFFFF' : '#2563EB',
                transition: 'all 0.15s ease'
              }}
            >
              Audit Siklus Hidup Aset ({assetsLifecycle.length})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder={activeTab === 'pelanggan' ? "Cari nama, dusun, SN modem..." : "Cari nama aset, merk..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78rem',
                color: '#152C4A',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'pelanggan' ? (
            /* TAB 1: INSTALLED MODEMS AT CUSTOMERS */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>Pelanggan</th>
                  <th style={{ padding: '10px 14px' }}>Wilayah / Dusun</th>
                  <th style={{ padding: '10px 14px' }}>Titik ODP & Port</th>
                  <th style={{ padding: '10px 14px' }}>Serial Number (SN) Modem</th>
                  <th style={{ padding: '10px 14px' }}>Paket</th>
                  <th style={{ padding: '10px 14px' }}>Status Layanan</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      Tidak ada data perangkat aktif yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust, idx) => (
                    <tr key={cust.id || idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#152C4A' }}>{cust.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{cust.phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#3B82F6" />
                          <span style={{ fontWeight: 600 }}>{cust.dusun || cust.address || 'Subang'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#2563EB' }}>{cust.odp?.name || 'ODP-SLG-01'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Port {cust.odp_port || 1}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: '#152C4A', border: '1px solid #E2E8F0' }}>
                          {cust.modem_sn || 'ZTE-F670L-INSTALLED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>
                        {cust.package_speed || cust.package || '20 Mbps'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          backgroundColor: cust.status === 'Aktif' ? '#ECFDF5' : (cust.status === 'Isolir' ? '#FFFBEB' : '#F1F5F9'),
                          color: cust.status === 'Aktif' ? '#059669' : (cust.status === 'Isolir' ? '#D97706' : '#64748B'),
                          padding: '2px 8px',
                          borderRadius: '99px',
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}>
                          ● {cust.status || 'Aktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 2: LIFECYCLE AUDIT */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>NAMA ASET</th>
                  <th style={{ padding: '10px 14px' }}>MERK</th>
                  <th style={{ padding: '10px 14px' }}>TIPE</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>TOTAL MASUK</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>TOTAL KELUAR</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>DI GUDANG</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>TERPASANG</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>RUSAK</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredLifecycle.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      Tidak ada data siklus aset yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredLifecycle.map((asset) => {
                    const diGudang = (asset.readyGudang || 0) + (asset.cabutanRts || 0);
                    return (
                      <tr key={asset.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#152C4A' }}>
                          <button
                            onClick={() => handleOpenDetail(asset.raw)}
                            style={{ background: 'none', border: 'none', padding: 0, color: '#152C4A', fontWeight: 800, cursor: 'pointer', textAlign: 'left', fontSize: 'inherit' }}
                          >
                            {asset.nama}
                          </button>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>
                          {asset.merk || '-'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {asset.tipe}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace' }}>
                            {asset.totalMasuk} {asset.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace' }}>
                            {asset.terpasang} {asset.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace' }}>
                            {diGudang} {asset.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace' }}>
                            {asset.terpasang} {asset.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {asset.rusakScrap > 0 ? (
                            <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace' }}>
                              {asset.rusakScrap} {asset.unit}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace' }}>
                              0 {asset.unit}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenDetail(asset.raw)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#EFF8FC',
                              color: '#2563EB',
                              border: '1px solid #D8E6F3',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};
