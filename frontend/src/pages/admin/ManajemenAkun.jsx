import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Users, ShieldCheck, Wrench, RefreshCw, Edit2, Trash2, Phone, Mail, Filter, MessageCircle, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TambahTeknisiModal } from '../../components/TambahTeknisiModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const ManajemenAkun = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeknisi, setSelectedTeknisi] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [teknisiList, setTeknisiList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useDocumentTitle('Manajemen Akun & Role — FiberPulse');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        const mapped = json.data.map(u => ({
          id: u.id,
          nama: u.name,
          email: u.email,
          noHp: u.phone || '081234567890',
          role: u.role,
          status: u.status || 'Aktif'
        }));
        setTeknisiList(mapped);
      }
    } catch (e) {
      console.log('Offline fallback ManajemenAkun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setSelectedTeknisi(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedTeknisi(item);
    setIsModalOpen(true);
  };

  const handleSave = async (savedItem) => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const url = selectedTeknisi ? `/api/users/${selectedTeknisi.id}` : '/api/users';
      const method = selectedTeknisi ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: savedItem.nama,
          email: savedItem.email,
          password: savedItem.password || undefined,
          role: savedItem.role,
          phone: savedItem.noHp,
          status: savedItem.status
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && (!data || data.success !== false)) {
        toast.success(selectedTeknisi ? 'Akun berhasil diperbarui!' : (data?.message || 'Akun baru berhasil dibuat!'));
        
        // Optimistic real-time instant update into table
        const u = data?.data;
        if (u) {
          const itemFormatted = {
            id: u.id,
            nama: u.name,
            email: u.email,
            noHp: u.phone || '081234567890',
            role: u.role,
            status: u.status || 'Aktif'
          };
          if (selectedTeknisi) {
            setTeknisiList(prev => prev.map(t => t.id === itemFormatted.id ? itemFormatted : t));
          } else {
            setTeknisiList(prev => [itemFormatted, ...prev.filter(t => t.id !== itemFormatted.id)]);
          }
        }
        
        fetchUsers();
        return true;
      } else {
        toast.error(data?.message || 'Gagal menyimpan akun');
        return false;
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan: ' + e.message);
      return false;
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Yakin ingin menghapus akun ini secara permanen?')) {
      try {
        const token = localStorage.getItem('sanctum_token');
        const res = await fetch(`/api/users/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success('Akun berhasil dihapus');
          fetchUsers();
        } else {
          toast.error('Gagal menghapus akun');
        }
      } catch (error) {
        toast.error('Terjadi kesalahan jaringan');
      }
    }
  };

  // Filtered List with Null-Safety
  const filteredList = useMemo(() => {
    if (!Array.isArray(teknisiList)) return [];
    return teknisiList.filter(item => {
      if (!item) return false;
      const q = (searchQuery || '').toLowerCase();
      const nama = String(item.nama || '').toLowerCase();
      const email = String(item.email || '').toLowerCase();
      const role = String(item.role || '').toLowerCase();
      const noHp = String(item.noHp || '').toLowerCase();

      const matchesSearch = !q ? true : (nama.includes(q) || email.includes(q) || role.includes(q) || noHp.includes(q));
      const matchesRole = roleFilter === 'Semua' ? true : role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'Semua' ? true : String(item.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teknisiList, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const list = Array.isArray(teknisiList) ? teknisiList : [];
    const total = list.length;
    const admin = list.filter(u => String(u?.role).toLowerCase() === 'admin').length;
    const teknisi = list.filter(u => String(u?.role).toLowerCase() === 'teknisi').length;
    return { total, admin, teknisi };
  }, [teknisiList]);

  // Pagination logic
  const totalPages = Math.ceil(filteredList.length / (itemsPerPage === 'All' ? filteredList.length || 1 : itemsPerPage));
  const paginatedList = itemsPerPage === 'All' 
    ? filteredList 
    : filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <TambahTeknisiModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedTeknisi}
        onSave={handleSave}
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
            Manajemen Akun & Role Pengguna
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Kelola hak akses pengguna, admin sistem, dan teknisi lapangan FiberPulse Technologies Inc..
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          
          {/* Refresh Button */}
          <button 
            onClick={fetchUsers}
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
            onClick={handleOpenAdd}
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
            <span>Tambah Akun Baru</span>
          </button>

        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Total Pengguna */}
        <div 
          onClick={() => { setRoleFilter('Semua'); setStatusFilter('Semua'); }}
          style={{
            backgroundColor: roleFilter === 'Semua' && statusFilter === 'Semua' ? '#EFF6FF' : '#FFFFFF',
            border: `1px solid ${roleFilter === 'Semua' && statusFilter === 'Semua' ? '#3B82F6' : '#E2E8F0'}`,
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: roleFilter === 'Semua' ? '#1D4ED8' : '#94A3B8' }}>TOTAL PENGGUNA</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {stats.total} Akun
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>Semua Pengguna Terdaftar</p>
          </div>
        </div>

        {/* Card 2: Admin Sistem */}
        <div 
          onClick={() => setRoleFilter(roleFilter === 'admin' ? 'Semua' : 'admin')}
          style={{
            backgroundColor: roleFilter === 'admin' ? '#EFF6FF' : '#FFFFFF',
            border: `1px solid ${roleFilter === 'admin' ? '#2563EB' : '#E2E8F0'}`,
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: roleFilter === 'admin' ? '#1D4ED8' : '#94A3B8' }}>ADMIN SISTEM</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em' }}>
              {stats.admin} Akun
            </div>
            <p style={{ fontSize: '0.7rem', color: '#1D4ED8', margin: '3px 0 0 0', fontWeight: 500 }}>Akses Full Administrator</p>
          </div>
        </div>

        {/* Card 3: Teknisi Lapangan */}
        <div 
          onClick={() => setRoleFilter(roleFilter === 'teknisi' ? 'Semua' : 'teknisi')}
          style={{
            backgroundColor: roleFilter === 'teknisi' ? '#F5F3FF' : '#FFFFFF',
            border: `1px solid ${roleFilter === 'teknisi' ? '#8B5CF6' : '#E2E8F0'}`,
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: roleFilter === 'teknisi' ? '#6D28D9' : '#94A3B8' }}>TEKNISI LAPANGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#EDE9FE', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8B5CF6', letterSpacing: '-0.02em' }}>
              {stats.teknisi} Akun
            </div>
            <p style={{ fontSize: '0.7rem', color: '#6D28D9', margin: '3px 0 0 0', fontWeight: 500 }}>Akses Portal Mobile Teknisi</p>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Search & Filter Bar */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari nama, email, role, no HP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '0.75rem',
                backgroundColor: 'white', fontWeight: 500, color: '#152C4A', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: 600, color: '#152C4A' }}
              >
                <option value="Semua">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="admin_gudang">Admin Gudang</option>
                <option value="kepala_gudang">Kepala Teknisi Gudang</option>
                <option value="teknisi">Teknisi Lapangan</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: 600, color: '#152C4A' }}
              >
                <option value="Semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '950px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', width: '36px', textAlign: 'center', whiteSpace: 'nowrap' }}>NO</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA PENGGUNA</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>EMAIL AKUN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NO TELEPON (WA)</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>ROLE</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && teknisiList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>
                    Memuat data pengguna sistem...
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>
                    {searchQuery ? `Tidak ada akun cocok dengan pencarian "${searchQuery}"` : 'Belum ada akun pengguna terdaftar.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const roleLower = String(item.role || '').toLowerCase();
                  const isAdmin = roleLower === 'admin';
                  const cleanPhone = String(item.noHp || '').replace(/^0/, '').replace(/\D/g, '');

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: idx === paginatedList.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE', whiteSpace: 'nowrap' }}>
                      
                      {/* NO */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94A3B8', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* NAMA + AVATAR */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: isAdmin ? 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)' : '#EDE9FE',
                            color: isAdmin ? '#FFFFFF' : '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.65rem', flexShrink: 0
                          }}>
                            {getInitials(item.nama)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#152C4A', whiteSpace: 'nowrap' }}>{item.nama}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>ID Pengguna #{item.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td style={{ padding: '10px 14px', color: '#334155', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                          <Mail size={12} color="#94A3B8" /> {item.email}
                        </div>
                      </td>

                      {/* NO HP (WHATSAPP LINK) */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {cleanPhone ? (
                          <a 
                            href={`https://wa.me/62${cleanPhone}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#059669', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                            title="Chat WhatsApp"
                          >
                            <MessageCircle size={13} color="#10B981" /> {item.noHp}
                          </a>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>

                      {/* ROLE BADGE */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {String(item.role).toLowerCase() === 'admin_gudang' || String(item.role).toLowerCase() === 'admin gudang' ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <Package size={11} /> Admin Gudang
                          </span>
                        ) : String(item.role).toLowerCase() === 'kepala_gudang' || String(item.role).toLowerCase() === 'kepala teknisi gudang' ? (
                          <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <ShieldCheck size={11} /> Ka. Teknisi Gudang
                          </span>
                        ) : isAdmin ? (
                          <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <ShieldCheck size={11} /> Admin
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <Wrench size={11} /> Teknisi
                          </span>
                        )}
                      </td>

                      {/* STATUS BADGE */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {String(item.status).toLowerCase() === 'aktif' ? (
                          <span style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* AKSI CONTROL */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Akun"
                            style={{
                              background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A',
                              borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteUser(item.id)}
                            title="Hapus Akun"
                            style={{
                              background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                              borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px'
                            }}
                          >
                            <Trash2 size={11} /> Hapus
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

        {/* Pagination Controls Footer */}
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
