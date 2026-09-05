import React, { useState, useEffect, useMemo } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Search, Filter, RefreshCw, Users, UserCheck, UserX, 
  Eye, FileText, X, Plus, MapPin, MessageCircle, ChevronLeft, ChevronRight, Edit3 
} from 'lucide-react';
import { DetailPelangganModal } from '../../components/DetailPelangganModal';
import { EditPelangganModal } from '../../components/EditPelangganModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Pelanggan = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEditCustomer, setSelectedEditCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle('Data Pelanggan (CRM) — FiberPulse');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(c => ({
            id: c.id,
            name: String(c.name || 'Pelanggan'),
            nik: String(c.nik || '32040101018000' + c.id),
            phone: String(c.phone || '0812345678'),
            address: String(c.address || 'Wilayah Operasional'),
            dusun: String(c.dusun || 'Dusun 1'),
            package: String(c.package_speed || '30 Mbps'),
            status: String(c.status || 'Aktif'),
            odp: c.odp?.name || (c.odp_id ? `ODP-SLG-${String(c.odp_id).padStart(2, '0')}` : '-'),
            port: c.odp_port ? `Port ${c.odp_port}` : '-',
            latitude: c.latitude,
            longitude: c.longitude,
            modem_sn: c.modem_sn || null,
            raw: c
          }));
          setCustomers(mapped);
        }
      }
    } catch (e) {
      console.warn('Failed fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (idParam && customers.length > 0) {
      const match = customers.find(c => String(c.id) === String(idParam));
      if (match) {
        setSelectedCustomer(match);
        setIsDetailModalOpen(true);
      }
    }
  }, [location.search, customers]);

  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    return customers.filter(item => {
      if (!item) return false;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q ? true : (
        (item.name && String(item.name).toLowerCase().includes(q)) ||
        (item.nik && String(item.nik).toLowerCase().includes(q)) ||
        (item.phone && String(item.phone).toLowerCase().includes(q)) ||
        (item.address && String(item.address).toLowerCase().includes(q)) ||
        (item.dusun && String(item.dusun).toLowerCase().includes(q)) ||
        (item.odp && String(item.odp).toLowerCase().includes(q)) ||
        (item.odp_port && String(item.odp_port).toLowerCase().includes(q)) ||
        (item.port && String(item.port).toLowerCase().includes(q)) ||
        (item.package && String(item.package).toLowerCase().includes(q)) ||
        (item.package_speed && String(item.package_speed).toLowerCase().includes(q)) ||
        (item.modem_sn && String(item.modem_sn).toLowerCase().includes(q)) ||
        (item.id && `pel-${item.id}`.includes(q)) ||
        (item.id && String(item.id).includes(q)) ||
        (item.status && String(item.status).toLowerCase().includes(q))
      );

      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Aktif' ? item.status === 'Aktif' :
        item.status !== 'Aktif';

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleDetailClick = (customer, e) => {
    if (e) e.preventDefault();
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (customer, e) => {
    if (e) e.preventDefault();
    setSelectedEditCustomer(customer);
    setIsEditModalOpen(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / (itemsPerPage === 'All' ? filteredCustomers.length || 1 : itemsPerPage));
  const paginatedCustomers = itemsPerPage === 'All' 
    ? filteredCustomers 
    : filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeCount = customers.filter(c => c.status === 'Aktif').length;
  const nonActiveCount = customers.filter(c => c.status !== 'Aktif').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modal Detail Pelanggan */}
      <DetailPelangganModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        data={selectedCustomer}
        onEdit={(cust) => {
          setSelectedEditCustomer(cust);
          setIsEditModalOpen(true);
        }}
      />

      {/* Modal Edit Pelanggan */}
      <EditPelangganModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchCustomers();
        }}
        initialData={selectedEditCustomer}
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
            Data Pelanggan (CRM)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Kelola data pelanggan aktif/nonaktif, koordinat GPS presisi, alokasi ODP & port, serta integrasi WhatsApp.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Secondary Refresh Button */}
          <button 
            onClick={fetchCustomers} 
            disabled={loading}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh</span>
          </button>

          {/* Primary Action Button (FiberPulse Gradient) */}
          <button 
            onClick={() => navigate('/admin/order-pelanggan')}
            className="sgt-btn-primary"
            style={{
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <Plus size={15} />
            <span>Buat Order Baru</span>
          </button>

        </div>
      </div>
      
      {/* 3 Interactive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Total Pelanggan */}
        <div 
          onClick={() => setStatusFilter('Semua')}
          style={{ 
            backgroundColor: statusFilter === 'Semua' ? '#EFF6FF' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Semua' ? '#3B82F6' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Semua' ? '#1D4ED8' : '#94A3B8' }}>TOTAL PELANGGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {customers.length}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Semua' ? 'Filter Semua Data Aktif' : 'Klik untuk tampilkan semua'}
            </p>
          </div>
        </div>

        {/* Card 2: Pelanggan Aktif */}
        <div 
          onClick={() => setStatusFilter('Aktif')}
          style={{ 
            backgroundColor: statusFilter === 'Aktif' ? '#ECFDF5' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Aktif' ? '#10B981' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Aktif' ? '#059669' : '#94A3B8' }}>PELANGGAN AKTIF</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
              {activeCount}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Aktif' ? 'Filter Aktif Terpilih' : 'Klik untuk filter aktif'}
            </p>
          </div>
        </div>

        {/* Card 3: Nonaktif / Isolir */}
        <div 
          onClick={() => setStatusFilter('Nonaktif')}
          style={{ 
            backgroundColor: statusFilter === 'Nonaktif' ? '#FEF2F2' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Nonaktif' ? '#EF4444' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Nonaktif' ? '#DC2626' : '#94A3B8' }}>NONAKTIF / ISOLIR</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: nonActiveCount > 0 ? '#EF4444' : '#152C4A', letterSpacing: '-0.02em' }}>
              {nonActiveCount}
            </div>
            <p style={{ fontSize: '0.7rem', color: nonActiveCount > 0 ? '#DC2626' : '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Nonaktif' ? 'Filter Nonaktif Terpilih' : 'Klik untuk filter nonaktif'}
            </p>
          </div>
        </div>

      </div>
      
      {/* Table Section */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Table Toolbar Search */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari nama, NIK, no HP, alamat, ODP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
                backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {statusFilter !== 'Semua' && (
              <span style={{ 
                fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', 
                padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px',
                border: '1px solid #BFDBFE'
              }}>
                <Filter size={12} /> Status: <strong>{statusFilter}</strong>
                <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setStatusFilter('Semua')} />
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              <strong style={{ color: '#152C4A' }}>{filteredCustomers.length}</strong> Pelanggan Terdaftar
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '1050px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', width: '36px', textAlign: 'center', whiteSpace: 'nowrap' }}>NO</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA PELANGGAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NIK</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NO WHATSAPP</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>ALAMAT & GPS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>PAKET</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>ODP</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>PORT</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                    {searchQuery ? `Tidak ada pelanggan yang cocok dengan pencarian "${searchQuery}"` : 'Belum ada data pelanggan terdaftar.'}
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: idx === paginatedCustomers.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94A3B8', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div 
                        onClick={(e) => handleDetailClick(row, e)}
                        title={`Klik untuk melihat detail pelanggan ${row.name}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      >
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                          {getInitials(row.name)}
                        </div>
                        <span 
                          style={{ 
                            color: '#2563EB', fontWeight: 700, whiteSpace: 'nowrap',
                            textDecoration: 'none', transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#1D4ED8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#2563EB'; }}
                        >
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.nik}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.phone && row.phone !== '-' ? (
                        <a 
                          href={`https://wa.me/62${String(row.phone).replace(/^0/, '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#059669', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                          title="Chat WhatsApp Pelanggan"
                        >
                          <MessageCircle size={13} color="#10B981" /> {row.phone}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: '240px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address}</div>
                      {(row.latitude && row.longitude) ? (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${row.latitude},${row.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                        >
                          <MapPin size={11} /> {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
                        </a>
                      ) : (
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.dusun}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.package}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}><StatusBadge status={row.status} /></td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {row.odp !== '-' ? (
                        <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {row.odp}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.port}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <button 
                          onClick={(e) => handleDetailClick(row, e)}
                          title="Lihat Profil & Riwayat Pelanggan"
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
                        <button 
                          onClick={(e) => handleEditClick(row, e)}
                          title="Edit Data Pelanggan"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 8px', borderRadius: '6px',
                            backgroundColor: '#FFFBEB', color: '#D97706',
                            border: '1px solid #FDE68A', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      </div>
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
