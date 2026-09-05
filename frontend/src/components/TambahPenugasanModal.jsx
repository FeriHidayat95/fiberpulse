import React, { useState, useEffect } from 'react';
import { Wrench, X, MapPin, User, Calendar, FileText, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { SearchableSelect } from './SearchableSelect';
import toast from 'react-hot-toast';

export const TambahPenugasanModal = ({ isOpen, onClose, onSuccess, initialOrderId }) => {
  const [orders, setOrders] = useState([]);
  const [odps, setOdps] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('auto');
  const [bestTechId, setBestTechId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/orders').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/odps').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/users').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/tasks').then(r => r.json()).catch(() => ({ data: [] }))
      ]).then(([ordersRes, odpsRes, usersRes, tasksRes]) => {
        const filteredOrders = (ordersRes?.data || []).filter(o => o.status === 'Menunggu' || o.status === 'Pending' || (initialOrderId && o.id === initialOrderId));
        setOrders(filteredOrders);
        if (initialOrderId) setSelectedOrder(initialOrderId.toString());

        setOdps(odpsRes?.data || []);

        const techs = (usersRes?.data || []).filter(u => u.role?.toLowerCase() === 'teknisi');
        const tasks = tasksRes?.data || [];
        
        const activeTasksCounts = {};
        techs.forEach(t => activeTasksCounts[t.id] = 0);
        tasks.forEach(task => {
          if (task.status !== 'Selesai' && task.technician_id) {
            activeTasksCounts[task.technician_id] = (activeTasksCounts[task.technician_id] || 0) + 1;
          }
        });

        if (techs.length > 0) {
          const bestTech = techs.reduce((min, curr) => 
            (activeTasksCounts[curr.id] < activeTasksCounts[min.id]) ? curr : min
          );
          setBestTechId(bestTech.id.toString());
          
          const updatedTechs = techs.map(t => ({
            ...t,
            isRecommended: t.id === bestTech.id,
            activeCount: activeTasksCounts[t.id]
          }));
          setTechnicians(updatedTechs);
        }
      }).catch(err => {
        console.error("Error loading task data:", err);
      });
    }
  }, [isOpen, initialOrderId]);

  const handleSimpanTugas = async () => {
    const actualTechnician = selectedTechnician === 'auto' ? bestTechId : selectedTechnician;

    if (!selectedOrder || !actualTechnician) {
      toast.error("Pesanan dan Teknisi wajib dipilih!");
      return;
    }

    const orderObj = orders.find(o => o.id == selectedOrder);
    if (!orderObj) return;

    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_number: `TK-${Date.now()}`,
          title: `Penugasan ${orderObj.type || 'Pasang Baru'} - ${orderObj.customer_name || 'Pelanggan'}`,
          description: notes,
          type: orderObj.type || 'Pasang Baru',
          status: 'Menunggu',
          order_id: parseInt(selectedOrder),
          customer_id: orderObj.customer_id || null,
          technician_id: parseInt(actualTechnician)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Penugasan teknisi berhasil dibuat!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Gagal menyimpan tugas.');
      }
    } catch (e) {
      console.log('Error saving task', e);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F1F7FC',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB'
      }}>
        <Wrench size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>Tambah Penugasan Teknisi</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Delegasikan tiket pesanan baru atau perbaikan ke teknisi lapangan</p>
      </div>
    </div>
  );

  const customFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>* Field wajib diisi</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onClose} 
          disabled={saving}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button 
          type="button" 
          onClick={handleSimpanTugas} 
          disabled={saving}
          className="sgt-btn-primary"
          style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Tugas</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={customFooter} maxWidth="700px">
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Pilih Nomor Pesanan / Tiket <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <SearchableSelect 
          value={selectedOrder}
          onChange={setSelectedOrder}
          options={orders.map(o => ({
            value: o.id.toString(),
            label: `${o.order_number || `ORD-${o.id}`} - ${o.customer_name || 'Pelanggan'} (${o.type || 'Pasang Baru'})`
          }))}
          placeholder="Cari nomor pesanan atau nama pelanggan..."
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Teknisi Utama <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <SearchableSelect 
          value={selectedTechnician}
          onChange={setSelectedTechnician}
          options={[
            { value: 'auto', label: 'Otomatis (Sistem Pilih Beban Tugas Terendah)' },
            { isOptgroup: true, label: '--- Pilihan Manual ---' },
            ...technicians.map(t => ({
              value: t.id.toString(),
              label: `${t.name} ${t.isRecommended ? '(Rekomendasi Sistem)' : `(${t.activeCount} tugas aktif)`}`
            }))
          ]}
          placeholder="Pilih Teknisi Utama"
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Instruksi Khusus Lapangan <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 500 }}>(Opsional)</span>
        </label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan atau instruksi khusus untuk teknisi di lapangan..." 
          rows={3}
          style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.75rem', boxSizing: 'border-box' }}
        />
      </div>
    </Modal>
  );
};
