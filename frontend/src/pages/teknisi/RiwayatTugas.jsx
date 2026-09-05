import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, MapPin, RefreshCw, Search, History, ShieldCheck, Check, Calendar, ArrowRight, User } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './TugasSaya.css';

export const RiwayatTugas = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');

  useDocumentTitle('Riwayat Tugas Selesai — FiberPulse');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const techId = localStorage.getItem('user_id');
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`/api/tasks?status=Selesai&technician_id=${techId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        const mapped = json.data.map((item, idx) => {
          let typeBg = '#EFF6FF';
          let typeColor = '#2563EB';
          if (item.type === 'Pemeliharaan' || item.type === 'Maintenance') { 
            typeBg = '#FFFBEB'; 
            typeColor = '#D97706'; 
          } else if (item.type === 'Pencabutan' || item.type === 'Gangguan' || item.type === 'Perbaikan Gangguan') { 
            typeBg = '#FEF2F2'; 
            typeColor = '#DC2626'; 
          }

          let durationText = '-';
          let timeText = item.completed_at ? new Date(item.completed_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '';
          
          if (item.started_at && item.completed_at) {
            const diffMs = new Date(item.completed_at) - new Date(item.started_at);
            const diffMins = Math.round(diffMs / 60000);
            if (diffMins < 60) durationText = `${diffMins}m`;
            else durationText = `${Math.floor(diffMins/60)}j ${diffMins%60}m`;
          }

          return {
            id: item.id || idx + 1,
            ticketCode: item.ticket_code || `TK-${item.id}`,
            type: item.type || 'Pasang Baru',
            typeBg,
            typeColor,
            name: item.customer?.name || item.customer_name || item.title || `Pelanggan #${item.id}`,
            address: item.customer?.address || item.address || item.description || '-',
            date: item.completed_at ? new Date(item.completed_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : (item.created_at ? item.created_at.split('T')[0] : '-'),
            completed_at: item.completed_at,
            time: timeText,
            duration: durationText,
            status: 'Selesai'
          };
        });
        setHistoryList(mapped);
      }
    } catch (e) {
      console.log('Offline fallback RiwayatTugas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return historyList.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ? true : (
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );

      const matchFilter = activeFilter === 'Semua' ? true : (
        activeFilter === 'PSB' ? (item.type.includes('Pasang') || item.type.includes('PSB')) :
        activeFilter === 'Gangguan' ? (item.type.includes('Gangguan') || item.type.includes('Perbaikan')) :
        activeFilter === 'Pencabutan' ? item.type.includes('Pencabutan') : true
      );

      return matchSearch && matchFilter;
    });
  }, [historyList, searchQuery, activeFilter]);

  // Dynamic counts
  const psbCount = historyList.filter(t => t.type.includes('Pasang') || t.type.includes('PSB')).length;
  const gangguanCount = historyList.filter(t => t.type.includes('Gangguan') || t.type.includes('Perbaikan')).length;
  const cabutCount = historyList.filter(t => t.type.includes('Pencabutan')).length;

  return (
    <div className="tk-main-content">
      
      {/* Hero Operations Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1rem 1.15rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
              Riwayat Tugas Selesai
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              Histori log pekerjaan PSB, perbaikan gangguan, dan pemeliharaan lapangan.
            </p>
          </div>

          <button 
            onClick={fetchHistory}
            disabled={loading}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#152C4A',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2" style={{ marginBottom: '1rem' }}>
        
        {/* Total Selesai */}
        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
          padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          gap: '0.35rem', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>TOTAL TUNTAS</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
              {historyList.length} Tiket
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 500 }}>Histori Penugasan</div>
          </div>
        </div>

        {/* Pasang Baru Selesai */}
        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
          padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          gap: '0.35rem', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94A3B8' }}>PSB TERPASANG</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={13} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
              {psbCount} Pelanggan
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 500 }}>Instalasi Aktif</div>
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="tk-filter-scroll">
        {[
          { key: 'Semua', label: `Semua (${historyList.length})` },
          { key: 'PSB', label: `PSB (${psbCount})` },
          { key: 'Gangguan', label: `Gangguan (${gangguanCount})` },
          { key: 'Pencabutan', label: `Cabut (${cabutCount})` }
        ].map(tab => (
          <button 
            key={tab.key} 
            className={`tk-filter-pill ${activeFilter === tab.key ? 'active' : 'inactive'}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input 
          type="text" 
          placeholder="Cari histori pelanggan, alamat..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
            borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
            backgroundColor: '#FFFFFF', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* History Cards Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#F1F7FC', color: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
              <History size={24} />
            </div>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#152C4A', margin: 0 }}>Belum Ada Riwayat Selesai</p>
            <p style={{ fontSize: '0.725rem', color: '#64748B', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>
              Tugas yang telah Anda selesaikan di lapangan akan otomatis tercatat dan tersimpan di sini.
            </p>
          </div>
        ) : (
          filteredList.map(item => (
            <div key={item.id} className="tk-task-card" style={{ padding: '0.85rem 1rem' }}>
              
              {/* Top row: Title + Type Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#152C4A' }}>{item.name}</h4>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'monospace' }}>ID Tiket #{item.id}</div>
                </div>
                <span className="tk-task-type-badge" style={{ backgroundColor: item.typeBg, color: item.typeColor, border: `1px solid ${item.typeBg}` }}>
                  {item.type}
                </span>
              </div>

              {/* Address */}
              <div className="tk-task-info-row" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                <MapPin size={13} color="#2563EB" style={{ flexShrink: 0 }} /> 
                <span style={{ color: '#475569', lineHeight: 1.3 }}>{item.address}</span>
              </div>

              {/* Bottom info row: Date, Duration, Selesai */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B' }}>
                  <Clock size={12} color="#94A3B8" />
                  <span style={{ fontFamily: 'monospace' }}>{item.date} {item.time && <span>({item.time})</span>}</span>
                  {item.duration !== '-' && (
                    <>
                      <span>•</span>
                      <span>Durasi: <strong style={{ color: '#152C4A', fontFamily: 'monospace' }}>{item.duration}</strong></span>
                    </>
                  )}
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                  <CheckCircle2 size={11} />
                  <span>Selesai</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
