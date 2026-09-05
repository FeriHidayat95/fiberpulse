import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, User, Calendar, Wrench, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TambahPenugasanModal } from '../../components/TambahPenugasanModal';
import { DetailPenugasanModal } from '../../components/DetailPenugasanModal';
import { DetailPelangganModal } from '../../components/DetailPelangganModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

export const PenugasanTeknisi = () => {
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useDocumentTitle('Penugasan Teknisi — FiberPulse');

  const fetchAdminTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks?t=' + Date.now());
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        const mapped = json.data.map((item, idx) => {
          const tknName = item.technician?.name || null;
          const initials = (tknName && typeof tknName === 'string') 
            ? tknName.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() 
            : '?';
          const isEskalasi = (item.technician_notes && String(item.technician_notes).includes('MEMBUTUHKAN PERGANTIAN BARANG')) || item.status === 'Eskalasi Admin';
          return {
            id: item.id || idx + 1,
            idTugas: item.ticket_number || `#TK00${idx+1}`,
            type: item.type === 'Pasang Baru' ? 'Pemasangan' : ((item.type === 'Perbaikan Gangguan' || item.type === 'Pemeliharaan') ? 'Pemeliharaan' : (item.type === 'Pembangunan' || item.type === 'Pembangunan Jaringan' ? 'Pembangunan' : 'Pencabutan')),
            status: item.status === 'Selesai' ? 'Selesai' : (item.status === 'Dikerjakan' || item.status === 'Diproses' ? 'Diproses' : (isEskalasi ? 'Eskalasi Admin' : 'Pending')),
            customer: item.customer?.name || (item.title ? String(item.title).replace(/^.*?\s*-\s*/, '') : 'Pelanggan Umum'),
            address: item.customer?.address || item.description || '-',
            teknisi: tknName,
            teknisiInitials: initials,
            date: item.created_at ? String(item.created_at).split('T')[0] : '2026-07-01',
            odp: item.odp ? item.odp.name : 'Belum ditentukan',
            raw: item
          };
        });
        setTasks(mapped);
      }
    } catch (e) {
      console.log('Offline fallback PenugasanTeknisi', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTasks();
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search') || params.get('q');
    const ticketParam = params.get('ticket') || params.get('ticket_number');
    const actionParam = params.get('action');

    if (searchParam) setSearchQuery(searchParam);
    if (ticketParam) setSearchQuery(ticketParam);
    if (actionParam === 'create') setIsTambahModalOpen(true);
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const taskIdParam = params.get('id') || params.get('task_id');
      const ticketParam = params.get('ticket') || params.get('ticket_number');

      if (taskIdParam) {
        const found = tasks.find(t => String(t.id) === String(taskIdParam) || String(t.raw?.id) === String(taskIdParam));
        if (found) setSelectedTask(found);
      } else if (ticketParam) {
        const found = tasks.find(t => String(t.idTugas).includes(ticketParam) || String(t.raw?.ticket_number).includes(ticketParam));
        if (found) setSelectedTask(found);
      }
    }
  }, [tasks]);

  const handleCancelTask = async (task, e) => {
    e.stopPropagation();
    if (task.status === 'Selesai' || task.status === 'Diproses' || task.status === 'Dikerjakan') {
      toast.error('Tugas tidak dapat dibatalkan karena sedang dikerjakan atau telah selesai.');
      return;
    }
    if (window.confirm(`Batalkan penugasan ${task.idTugas}?`)) {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          toast.success('Penugasan berhasil dibatalkan');
          setTasks(tasks.filter(t => t.id !== task.id));
        } else {
          toast.error(json.message || 'Gagal membatalkan penugasan');
        }
      } catch (err) {
        toast.error('Terjadi kesalahan saat membatalkan tugas');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ? true : (
      (task.customer && String(task.customer).toLowerCase().includes(q)) ||
      (task.idTugas && String(task.idTugas).toLowerCase().includes(q)) ||
      (task.raw?.ticket_number && String(task.raw.ticket_number).toLowerCase().includes(q)) ||
      (task.address && String(task.address).toLowerCase().includes(q)) ||
      (task.teknisi && String(task.teknisi).toLowerCase().includes(q)) ||
      (task.odp && String(task.odp).toLowerCase().includes(q)) ||
      (task.date && String(task.date).toLowerCase().includes(q)) ||
      (task.status && String(task.status).toLowerCase().includes(q)) ||
      (task.type && String(task.type).toLowerCase().includes(q)) ||
      (task.raw?.description && String(task.raw.description).toLowerCase().includes(q)) ||
      (task.raw?.technician_notes && String(task.raw.technician_notes).toLowerCase().includes(q))
    );
    const matchesType = filterType === 'All' || task.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Pemasangan':
        return { bg: '#2563EB', text: 'white', badgeBg: 'rgba(255, 255, 255, 0.2)', badgeText: 'white' };
      case 'Pemeliharaan':
        return { bg: '#F59E0B', text: 'white', badgeBg: 'rgba(255, 255, 255, 0.2)', badgeText: 'white' };
      case 'Pencabutan':
        return { bg: '#EF4444', text: 'white', badgeBg: 'rgba(255, 255, 255, 0.2)', badgeText: 'white' };
      case 'Pembangunan':
        return { bg: '#10B981', text: 'white', badgeBg: 'rgba(255, 255, 255, 0.2)', badgeText: 'white' };
      default:
        return { bg: '#64748B', text: 'white', badgeBg: 'rgba(255, 255, 255, 0.2)', badgeText: 'white' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'Diproses':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Pending':
        return { bg: '#FEE2E2', text: '#EF4444' };
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const handleCustomerClick = (task, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedCustomerForDetail({
      id: task.raw?.customer_id || task.raw?.customer?.id,
      name: task.customer || task.raw?.customer?.name,
      phone: task.raw?.customer?.phone || '-',
      address: task.address || task.raw?.customer?.address || '-',
      dusun: task.raw?.customer?.dusun || '-',
      odp: task.odp || task.raw?.odp?.name || '-',
      port: task.raw?.customer?.odp_port || task.raw?.port || 'Port 1',
      status: task.raw?.customer?.status || 'Aktif',
      subscription_date: task.raw?.customer?.subscription_date || task.raw?.customer?.created_at,
      package: task.raw?.customer?.package,
      raw: task.raw?.customer || task.raw
    });
    setIsCustomerDetailOpen(true);
  };

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      
      <TambahPenugasanModal 
        isOpen={isTambahModalOpen}
        onClose={() => setIsTambahModalOpen(false)}
        onSuccess={fetchAdminTasks}
      />

      <DetailPenugasanModal 
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        data={selectedTask}
      />

      <DetailPelangganModal 
        isOpen={isCustomerDetailOpen} 
        onClose={() => setIsCustomerDetailOpen(false)} 
        data={selectedCustomerForDetail} 
      />

      {/* Header Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.25rem 0' }}>
            Penugasan Teknisi {loading && <span style={{fontSize: '0.8rem', color: '#64748B'}}>(Live...)</span>}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
            Kelola dan pantau penugasan teknisi lapangan (Live PostgreSQL)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAdminTasks} style={{background: 'white', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155'}}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Live
          </button>
          <Button 
            variant="primary" 
            onClick={() => setIsTambahModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px' }}
          >
            <Plus size={18} /> Tambah Tugas
          </Button>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
          <span 
            onClick={() => setFilterType('All')}
            style={{ cursor: 'pointer', color: filterType === 'All' ? '#1E293B' : '#64748B', fontWeight: filterType === 'All' ? 700 : 500 }}
          >
            Semua ({tasks.length})
          </span>
          <span 
            onClick={() => setFilterType(filterType === 'Pemasangan' ? 'All' : 'Pemasangan')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: filterType === 'Pemasangan' ? '#2563EB' : '#475569', fontWeight: filterType === 'Pemasangan' ? 700 : 500 }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }}></span>
            Pemasangan
          </span>
          <span 
            onClick={() => setFilterType(filterType === 'Pembangunan' ? 'All' : 'Pembangunan')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: filterType === 'Pembangunan' ? '#10B981' : '#475569', fontWeight: filterType === 'Pembangunan' ? 700 : 500 }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
            Pembangunan
          </span>
          <span 
            onClick={() => setFilterType(filterType === 'Pemeliharaan' ? 'All' : 'Pemeliharaan')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: filterType === 'Pemeliharaan' ? '#D97706' : '#475569', fontWeight: filterType === 'Pemeliharaan' ? 700 : 500 }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
            Pemeliharaan
          </span>
          <span 
            onClick={() => setFilterType(filterType === 'Pencabutan' ? 'All' : 'Pencabutan')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: filterType === 'Pencabutan' ? '#EF4444' : '#475569', fontWeight: filterType === 'Pencabutan' ? 700 : 500 }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }}></span>
            Pencabutan
          </span>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Cari tugas, pelanggan..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredTasks.map((task, idx) => {
          const typeStyle = getTypeStyle(task.type);
          const statusBadge = getStatusBadge(task.status);
          const isFinished = task.status === 'Selesai';

          return (
            <div 
              key={task.id || task.idTugas || idx}
              onClick={() => setSelectedTask(task)}
              style={{
                backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
            >
              {/* Card Header */}
              <div style={{
                backgroundColor: typeStyle.bg, color: typeStyle.text,
                padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
                  <Wrench size={18} />
                  <span>{task.type}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{task.idTugas}</span>
                </div>

                <span style={{
                  padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                  backgroundColor: statusBadge.bg, color: statusBadge.text
                }}>
                  {task.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                
                {/* Customer */}
                <div 
                  onClick={(e) => handleCustomerClick(task, e)}
                  title={`Klik untuk melihat profil pelanggan ${task.customer}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <User size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
                  <span 
                    style={{ 
                      fontWeight: 700, color: '#2563EB', fontSize: '0.95rem',
                      textDecoration: 'none', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#1D4ED8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#2563EB'; }}
                  >
                    {task.customer}
                  </span>
                </div>

                {/* Address */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748B' }}>
                  <MapPin size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                  <span>{task.address}</span>
                </div>

                {/* Teknisi */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '10px', 
                    backgroundColor: task.teknisi ? '#EFF6FF' : '#FEF2F2',
                    color: task.teknisi ? '#2563EB' : '#EF4444', 
                    fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {task.teknisiInitials}
                  </div>
                  <span style={{ color: task.teknisi ? '#475569' : '#EF4444', fontWeight: task.teknisi ? 400 : 500 }}>
                    {task.teknisi || 'Belum Di-assign'}
                  </span>
                </div>

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748B' }}>
                  <Calendar size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                  <span>{task.date}</span>
                </div>

                {/* ODP Box */}
                {task.odp && (
                  <div style={{
                    marginTop: '0.25rem', padding: '0.6rem 0.75rem', backgroundColor: '#F8FAFC',
                    borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.8rem', color: '#475569', fontWeight: 500
                  }}>
                    <MapPin size={14} style={{ color: '#3B82F6' }} />
                    <span>{task.odp}</span>
                  </div>
                )}

              </div>

              {/* Card Footer */}
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', display: 'flex', gap: '0.75rem' }}>
                <Button 
                  variant="primary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.875rem', borderRadius: '8px' }}
                >
                  Lihat Detail
                </Button>

                {!isFinished && task.status === 'Pending' && (
                  <button 
                    onClick={(e) => handleCancelTask(task, e)}
                    style={{
                      flex: 1, padding: '0.6rem', fontSize: '0.875rem', borderRadius: '8px',
                      backgroundColor: '#EF4444', color: 'white', border: 'none', fontWeight: 600,
                      cursor: 'pointer', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; }}
                  >
                    Batalkan
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
