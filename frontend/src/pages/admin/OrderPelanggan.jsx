import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { 
  Search, Eye, Trash2, FileText, CheckCircle2, Activity, Clock, 
  RefreshCw, Send, Edit3, X, ChevronLeft, ChevronRight, AlertTriangle, 
  Filter, Plus, Zap, MessageCircle 
} from 'lucide-react';
import { DetailOrderModal } from '../../components/DetailOrderModal';
import { DetailPelangganModal } from '../../components/DetailPelangganModal';
import { TambahOrderModal } from '../../components/TambahOrderModal';
import { TambahPenugasanModal } from '../../components/TambahPenugasanModal';
import { EditOrderModal } from '../../components/EditOrderModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const OrderPelanggan = () => {
  // Modal & Selection States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [isPenugasanModalOpen, setIsPenugasanModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection & Bulk Action States
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [targetBulkStatus, setTargetBulkStatus] = useState('Proses');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const queryClient = useQueryClient();
  useDocumentTitle('Order & PSB Pelanggan — FiberPulse');

  // Fetch & Deduplicate Combined Orders & Tasks Data
  const { data: orders = [], isLoading: loading, refetch: fetchOrders } = useQuery({
    queryKey: ['orders-and-tasks'],
    queryFn: async () => {
      const ordersMap = new Map();

      // 1. Fetch Orders
      try {
        const resOrders = await fetch('/api/orders');
        if (resOrders.ok) {
          const jsonOrders = await resOrders.json();
          if (jsonOrders.success && Array.isArray(jsonOrders.data)) {
            jsonOrders.data.forEach(o => {
              if (!o) return;
              const custId = o.customer_id;
              const phone = String(o.customer_phone || o.customer?.phone || '');
              const name = String(o.customer_name || o.customer?.name || '');

              ordersMap.set(`ord-${o.id}`, {
                uniqueKey: `order-${o.id}`,
                id: o.id,
                orderId: o.id,
                taskId: null,
                isTask: false,
                noPesanan: o.order_number || `ORD-${o.id}`,
                customerId: custId,
                idPsng: custId ? `PSG-${custId}` : '-',
                nama: name || 'Pelanggan Baru',
                noHp: phone || '-',
                alamat: String(o.customer_address || o.customer?.address || 'Wilayah Operasional'),
                layanan: String(o.type || o.service_type || 'Pasang Baru'),
                paket: String(o.package_speed || o.package_name || '20 Mbps'),
                status: String(o.status || 'Pending'),
                tanggal: typeof o.created_at === 'string' ? o.created_at.split('T')[0] : '2026-07-01',
                technicianName: o.technician?.name ? String(o.technician.name) : null,
                raw: o
              });
            });
          }
        }
      } catch (e) {
        console.warn("Failed fetching orders:", e);
      }

      // 2. Fetch Tasks & Merge into Orders
      try {
        const resTasks = await fetch('/api/tasks');
        if (resTasks.ok) {
          const jsonTasks = await resTasks.json();
          if (jsonTasks.success && Array.isArray(jsonTasks.data)) {
            jsonTasks.data.forEach(t => {
              if (!t) return;
              const custId = t.customer_id;
              const phone = String(t.customer?.phone || '');
              const rawTitle = typeof t.title === 'string' ? t.title : '';
              const name = String(t.customer?.name || (rawTitle ? rawTitle.replace(/^.*?\s*-\s*/, '') : ''));

              let matchedKey = null;
              for (const [key, item] of ordersMap.entries()) {
                if (custId && item.customerId && Number(item.customerId) === Number(custId)) {
                  matchedKey = key;
                  break;
                }
                if (phone && item.noHp && item.noHp !== '-' && item.noHp === phone) {
                  matchedKey = key;
                  break;
                }
                if (name && item.nama && String(name).toLowerCase() === String(item.nama).toLowerCase()) {
                  matchedKey = key;
                  break;
                }
              }

              if (matchedKey) {
                const existing = ordersMap.get(matchedKey);
                const mergedStatus = t.status === 'Selesai' ? 'Selesai' : (t.status === 'Dikerjakan' ? 'Proses' : existing.status);
                ordersMap.set(matchedKey, {
                  ...existing,
                  taskId: t.id,
                  taskTicketNumber: t.ticket_number,
                  status: mergedStatus,
                  technicianName: t.technician?.name ? String(t.technician.name) : (existing.technicianName || 'Teknisi FiberPulse'),
                  technicianPhone: t.technician?.phone ? String(t.technician.phone) : '081234567890',
                  proof_photo_url: t.proof_photo_url || existing.proof_photo_url || null,
                  technician_notes: t.technician_notes || existing.technician_notes || null,
                  additional_materials: t.additional_materials || existing.additional_materials || null,
                  returned_materials: t.returned_materials || existing.returned_materials || null,
                  latitude: t.latitude || existing.latitude || null,
                  longitude: t.longitude || existing.longitude || null,
                  raw: { ...(existing.raw || {}), ...t }
                });
              } else {
                ordersMap.set(`task-${t.id}`, {
                  uniqueKey: `task-${t.id}`,
                  id: t.id,
                  orderId: null,
                  taskId: t.id,
                  isTask: true,
                  noPesanan: t.ticket_number || `TK-${t.id}`,
                  customerId: custId,
                  idPsng: custId ? `PSG-${custId}` : '-',
                  nama: name || 'Pelanggan WA',
                  noHp: phone || '-',
                  alamat: String(t.customer?.address || t.description || 'Wilayah Operasional'),
                  layanan: t.type === 'Pasang Baru' ? 'Pasang Baru' : (t.type === 'Perbaikan Gangguan' ? 'Perbaikan Gangguan' : 'Pencabutan'),
                  paket: String(t.customer?.package_speed || '30 Mbps'),
                  status: t.status === 'Selesai' ? 'Selesai' : (t.status === 'Dikerjakan' ? 'Proses' : 'Pending'),
                  tanggal: typeof t.created_at === 'string' ? t.created_at.split('T')[0] : '2026-07-01',
                  technicianName: t.technician?.name ? String(t.technician.name) : null,
                  raw: t
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn("Failed fetching tasks:", e);
      }

      return Array.from(ordersMap.values());
    }
  });

  // Filtered Dataset Computation
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(item => {
      if (!item) return false;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q ? true : (
        (item.nama && String(item.nama).toLowerCase().includes(q)) ||
        (item.noPesanan && String(item.noPesanan).toLowerCase().includes(q)) ||
        (item.idPsng && String(item.idPsng).toLowerCase().includes(q)) ||
        (item.alamat && String(item.alamat).toLowerCase().includes(q)) ||
        (item.dusun && String(item.dusun).toLowerCase().includes(q)) ||
        (item.noHp && String(item.noHp).toLowerCase().includes(q)) ||
        (item.layanan && String(item.layanan).toLowerCase().includes(q)) ||
        (item.paket && String(item.paket).toLowerCase().includes(q)) ||
        (item.teknisi && String(item.teknisi).toLowerCase().includes(q)) ||
        (item.technicianName && String(item.technicianName).toLowerCase().includes(q)) ||
        (item.odp && String(item.odp).toLowerCase().includes(q)) ||
        (item.taskTicketNumber && String(item.taskTicketNumber).toLowerCase().includes(q)) ||
        (item.tglOrder && String(item.tglOrder).toLowerCase().includes(q)) ||
        (item.status && String(item.status).toLowerCase().includes(q))
      );

      const itemStatus = String(item.status || 'Pending');
      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Selesai' ? itemStatus === 'Selesai' :
        statusFilter === 'Proses' ? (itemStatus === 'Proses' || itemStatus === 'Dikerjakan') :
        (itemStatus === 'Pending' || itemStatus === 'Menunggu' || itemStatus === 'Menunggu Teknisi');

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Pagination computations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / (itemsPerPage === 'All' ? totalItems || 1 : itemsPerPage)) || 1;
  const startIndex = itemsPerPage === 'All' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'All' ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);
  const currentPaginatedOrders = useMemo(() => {
    if (itemsPerPage === 'All') return filteredOrders;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search') || params.get('q');
    const idParam = params.get('id') || params.get('order_id');
    const ticketParam = params.get('ticket') || params.get('no_pesanan');

    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if ((idParam || ticketParam) && orders.length > 0) {
      const match = orders.find(o => 
        (idParam && (String(o.id) === String(idParam) || String(o.orderId) === String(idParam) || String(o.taskId) === String(idParam) || String(o.customerId) === String(idParam))) ||
        (ticketParam && (String(o.noPesanan).toLowerCase() === String(ticketParam).toLowerCase() || String(o.raw?.order_number).toLowerCase() === String(ticketParam).toLowerCase() || String(o.raw?.ticket_number).toLowerCase() === String(ticketParam).toLowerCase()))
      );
      if (match) {
        setSelectedOrder(match);
        setIsDetailModalOpen(true);
      }
    }
  }, [orders]);

  const handleRowSelectToggle = (uniqueKey) => {
    setSelectedKeys(prev => 
      prev.includes(uniqueKey) ? prev.filter(k => k !== uniqueKey) : [...prev, uniqueKey]
    );
  };

  const handleSelectAllToggle = () => {
    const currentPageKeys = currentPaginatedOrders.map(o => o.uniqueKey);
    const allSelected = currentPageKeys.every(k => selectedKeys.includes(k));

    if (allSelected) {
      setSelectedKeys(prev => prev.filter(k => !currentPageKeys.includes(k)));
    } else {
      setSelectedKeys(prev => Array.from(new Set([...prev, ...currentPageKeys])));
    }
  };

  const isAllCurrentSelected = currentPaginatedOrders.length > 0 && 
    currentPaginatedOrders.every(o => selectedKeys.includes(o.uniqueKey));

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleDetailClick = (order, e) => {
    e.preventDefault();
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (order, e) => {
    e.preventDefault();
    if (order.status !== 'Menunggu' && order.status !== 'Pending') {
      toast.error('Pesanan tidak dapat diedit karena sedang diproses atau telah selesai.');
      return;
    }
    setOrderToEdit(order);
    setIsEditModalOpen(true);
  };

  const handleTugaskanClick = (order, e) => {
    e.preventDefault();
    setSelectedOrder(order);
    setIsPenugasanModalOpen(true);
  };

  const handleDeleteClick = async (order, e) => {
    e.preventDefault();
    if (order.status !== 'Menunggu' && order.status !== 'Pending') {
      toast.error('Pesanan tidak dapat dihapus karena sedang diproses atau telah selesai.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus order pesanan "${order.noPesanan}" untuk ${order.nama}?`)) {
      return;
    }

    try {
      if (order.isTask) {
        await fetch(`/api/tasks/${order.taskId}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/orders/${order.orderId}`, { method: 'DELETE' });
      }
      toast.success("Order berhasil dihapus.");
      fetchOrders();
      queryClient.invalidateQueries({ queryKey: ['orders-and-tasks'] });
    } catch (err) {
      toast.error("Gagal menghapus order.");
    }
  };

  const handleAutoDispatchBatch = async () => {
    toast.loading('Menjalankan Penugasan Otomatis ke Teknisi...');
    try {
      const res = await fetch('/api/orders/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'workload', max_tasks_per_tech: 5 })
      });
      const data = await res.json();
      toast.dismiss();
      if (data.success) {
        toast.success(data.message || `Auto-dispatch sukses! ${data.assigned_count} order ditugaskan.`);
        fetchOrders();
        queryClient.invalidateQueries({ queryKey: ['orders-and-tasks'] });
      } else {
        toast.error(data.message || "Gagal auto-dispatch.");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Gagal terhubung ke server auto-dispatch.");
    }
  };

  const handleCustomerClick = (row, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedCustomerForDetail({
      id: row.customerId || row.raw?.customer_id || row.raw?.customer?.id,
      name: row.nama || row.raw?.customer_name || row.raw?.customer?.name,
      phone: row.noHp || row.raw?.customer_phone || row.raw?.customer?.phone,
      address: row.alamat || row.raw?.customer_address || row.raw?.customer?.address,
      dusun: row.dusun || row.raw?.customer_dusun || row.raw?.customer?.dusun,
      odp: row.odp || row.raw?.odp?.name || row.raw?.odp_name,
      port: row.port || row.raw?.odp_port || row.raw?.customer?.odp_port,
      status: row.raw?.customer?.status || 'Aktif',
      subscription_date: row.raw?.customer?.subscription_date || row.raw?.customer?.created_at,
      package: row.paket || row.raw?.customer?.package,
      raw: row.raw?.customer || row.raw
    });
    setIsCustomerDetailOpen(true);
  };

  const orderSelesaiCount = orders.filter(o => o.status === 'Selesai').length;
  const orderProsesCount = orders.filter(o => o.status === 'Proses' || o.status === 'Dikerjakan').length;
  const orderPendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Menunggu' || o.status === 'Menunggu Teknisi').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Modals */}
      <DetailOrderModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        data={selectedOrder} 
      />
      <DetailPelangganModal 
        isOpen={isCustomerDetailOpen} 
        onClose={() => setIsCustomerDetailOpen(false)} 
        data={selectedCustomerForDetail} 
      />
      {isTambahModalOpen && (
        <TambahOrderModal 
          isOpen={isTambahModalOpen} 
          onClose={() => setIsTambahModalOpen(false)} 
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders-and-tasks'] });
            fetchOrders();
            setIsTambahModalOpen(false);
          }}
        />
      )}
      {isPenugasanModalOpen && (
        <TambahPenugasanModal 
          isOpen={isPenugasanModalOpen} 
          onClose={() => setIsPenugasanModalOpen(false)} 
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders-and-tasks'] });
            fetchOrders();
            setIsPenugasanModalOpen(false);
          }}
          initialOrderId={selectedOrder?.id}
        />
      )}
      {isEditModalOpen && (
        <EditOrderModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          data={orderToEdit}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders-and-tasks'] });
            fetchOrders();
            setIsEditModalOpen(false);
          }}
          initialData={orderToEdit}
        />
      )}

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
            Order Pelanggan & Pasang Baru (PSB)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Kelola histori pemesanan, dispatch tiket teknisi, pemetaan ODP, serta integrasi penugasan lapangan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Auto-Dispatch Button */}
          <button 
            onClick={handleAutoDispatchBatch}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #10B981',
              color: '#059669',
              fontWeight: 700,
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
            title="Auto-assign semua order pending ke teknisi secara otomatis"
          >
            <Zap size={14} color="#10B981" />
            <span>Auto-Assign Teknisi</span>
          </button>

          {/* Secondary Refresh Button */}
          <button 
            onClick={fetchOrders} 
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
            onClick={() => setIsTambahModalOpen(true)}
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
            <span>Tambah Order Baru</span>
          </button>

        </div>
      </div>

      {/* 4 Interactive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Order */}
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
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Semua' ? '#1D4ED8' : '#94A3B8' }}>TOTAL ORDER</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#152C4A', letterSpacing: '-0.02em' }}>
              {orders.length}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Semua' ? 'Filter Semua Terpilih' : 'Semua Order & Tiket'}
            </p>
          </div>
        </div>
        
        {/* Card 2: Order Selesai */}
        <div 
          onClick={() => setStatusFilter('Selesai')}
          style={{ 
            backgroundColor: statusFilter === 'Selesai' ? '#ECFDF5' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Selesai' ? '#10B981' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Selesai' ? '#059669' : '#94A3B8' }}>ORDER SELESAI</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
              {orderSelesaiCount}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Selesai' ? 'Filter Selesai Terpilih' : 'Sukses Terinstalasi'}
            </p>
          </div>
        </div>

        {/* Card 3: Dalam Proses */}
        <div 
          onClick={() => setStatusFilter('Proses')}
          style={{ 
            backgroundColor: statusFilter === 'Proses' ? '#EFF6FF' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Proses' ? '#2563EB' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Proses' ? '#1D4ED8' : '#94A3B8' }}>DALAM PROSES</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em' }}>
              {orderProsesCount}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#1D4ED8', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Proses' ? 'Filter Proses Terpilih' : 'Sedang Dikerjakan Teknisi'}
            </p>
          </div>
        </div>

        {/* Card 4: Order Pending */}
        <div 
          onClick={() => setStatusFilter('Pending')}
          style={{ 
            backgroundColor: statusFilter === 'Pending' ? '#FFFBEB' : '#FFFFFF', 
            border: `1px solid ${statusFilter === 'Pending' ? '#F59E0B' : '#E2E8F0'}`, 
            borderRadius: '12px', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusFilter === 'Pending' ? '#B45309' : '#94A3B8' }}>ORDER PENDING</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em' }}>
              {orderPendingCount}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#B45309', margin: '3px 0 0 0', fontWeight: 500 }}>
              {statusFilter === 'Pending' ? 'Filter Pending Terpilih' : 'Menunggu Dispatch'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Floating Bulk Action Bar */}
        {selectedKeys.length > 0 && (
          <div style={{ 
            background: 'linear-gradient(135deg, #152C4A 0%, #1E293B 100%)', 
            color: 'white', 
            padding: '0.75rem 1.25rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #334155',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                background: '#2563EB', 
                color: 'white', 
                padding: '3px 10px', 
                borderRadius: '6px', 
                fontWeight: 700, 
                fontSize: '0.75rem' 
              }}>
                {selectedKeys.length} Order Terpilih
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Pilih aksi masal di bawah:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsBulkStatusModalOpen(true)}
                style={{ 
                  background: '#2563EB', color: 'white', border: 'none', 
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', 
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                }}
              >
                <Edit3 size={13} /> Ubah Status
              </button>

              <button 
                onClick={() => setIsBulkDeleteModalOpen(true)}
                style={{ 
                  background: '#DC2626', color: 'white', border: 'none', 
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', 
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                }}
              >
                <Trash2 size={13} /> Hapus Masal
              </button>

              <button 
                onClick={() => setSelectedKeys([])}
                style={{ 
                  background: '#475569', color: 'white', border: 'none', 
                  padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', 
                  fontWeight: 600, cursor: 'pointer' 
                }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Table Toolbar */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari nama, nomor pesanan, HP, alamat..." 
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
              <strong style={{ color: '#152C4A' }}>{totalItems}</strong> Order Ditemukan
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem', minWidth: '1100px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <th style={{ width: '36px', textAlign: 'center', padding: '10px 10px', whiteSpace: 'nowrap' }}>
                  <input 
                    type="checkbox" 
                    checked={isAllCurrentSelected}
                    onChange={handleSelectAllToggle}
                    style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                    title="Pilih Semua Halaman Ini"
                  />
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NO PESANAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NAMA PELANGGAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>ID PSNG.</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>NO WHATSAPP</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>ALAMAT</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>JENIS LAYANAN</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>PAKET</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>TANGGAL</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {currentPaginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                    {searchQuery ? `Tidak ada pesanan yang cocok dengan pencarian "${searchQuery}"` : 'Belum ada data order pesanan.'}
                  </td>
                </tr>
              ) : (
                currentPaginatedOrders.map((row, idx) => {
                  const isSelected = selectedKeys.includes(row.uniqueKey);

                  return (
                    <tr 
                      key={row.uniqueKey}
                      style={{ 
                        borderBottom: idx === currentPaginatedOrders.length - 1 ? 'none' : '1px solid #F1F5F9',
                        backgroundColor: isSelected ? '#EFF6FF' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE'),
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '10px 10px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleRowSelectToggle(row.uniqueKey)}
                          style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px', color: '#152C4A', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.noPesanan}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div 
                          onClick={(e) => handleCustomerClick(row, e)}
                          title={`Klik untuk melihat detail pelanggan ${row.nama}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        >
                          <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                            {getInitials(row.nama)}
                          </div>
                          <span 
                            style={{ 
                              color: '#2563EB', fontWeight: 700, whiteSpace: 'nowrap',
                              textDecoration: 'none', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#1D4ED8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#2563EB'; }}
                          >
                            {row.nama}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {row.idPsng !== '-' ? (
                          <span style={{ color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {row.idPsng}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {row.noHp && row.noHp !== '-' ? (
                          <a 
                            href={`https://wa.me/62${row.noHp.replace(/^0/, '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#059669', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                            title="Chat WhatsApp Pelanggan"
                          >
                            <MessageCircle size={13} color="#10B981" /> {row.noHp}
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }} title={row.alamat}>
                        {row.alamat}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <TypeBadge type={row.layanan} />
                      </td>
                      <td style={{ padding: '10px 14px', color: '#152C4A', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.paket}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, 
                          backgroundColor: row.status === 'Selesai' ? '#ECFDF5' : row.status === 'Proses' ? '#EFF6FF' : '#FFFBEB', 
                          color: row.status === 'Selesai' ? '#059669' : row.status === 'Proses' ? '#2563EB' : '#D97706', 
                          border: `1px solid ${row.status === 'Selesai' ? '#A7F3D0' : row.status === 'Proses' ? '#BFDBFE' : '#FDE68A'}`,
                          display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                        }}>
                          <div style={{ width: 5, height: 5, backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{row.tanggal}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={(e) => handleDetailClick(row, e)}
                            title="Lihat Detail Pesanan"
                            style={{ color: '#2563EB', backgroundColor: '#EFF8FC', border: '1px solid #D8E6F3', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                          <button 
                            onClick={(e) => handleEditClick(row, e)}
                            title="Edit Data Order"
                            style={{ color: '#D97706', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(row, e)}
                            title="Hapus Order"
                            style={{ color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                          {(row.status === 'Menunggu' || row.status === 'Pending' || row.status === 'Menunggu Teknisi') && (
                            <button 
                              onClick={(e) => handleTugaskanClick(row, e)}
                              className="sgt-btn-primary"
                              title="Tugaskan ke Teknisi Lapangan"
                              style={{
                                color: 'white', border: 'none',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Send size={11} /> Tugaskan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 1.25rem', 
          borderTop: '1px solid #E2E8F0', 
          backgroundColor: '#FFFFFF',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748B', fontWeight: 500 }}>Tampilkan:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))}
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
