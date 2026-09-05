import React, { useState, useEffect } from 'react';
import { Save, User, Phone, MapPin, Tag, FileText, Loader2, Edit3, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import toast from 'react-hot-toast';

export const EditOrderModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [jenisLayanan, setJenisLayanan] = useState('');
  const [status, setStatus] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [orderType, setOrderType] = useState('Pasang Baru');

  useEffect(() => {
    if (isOpen && initialData) {
      setNamaPelanggan(initialData.nama || '');
      setNoHp(initialData.noHp || '');
      setAlamat(initialData.alamat || '');
      setJenisLayanan(initialData.paket || '20 Mbps');
      setOrderType(initialData.layanan || initialData.raw?.type || 'Pasang Baru');
      setStatus(initialData.status || 'Menunggu');
      setKeterangan(initialData.raw?.notes || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSimpanOrder = async () => {
    if (!namaPelanggan.trim()) {
      toast.error("Nama Pelanggan wajib diisi!");
      return;
    }
    if (!noHp.trim()) {
      toast.error("No HP wajib diisi!");
      return;
    }
    if (!alamat.trim()) {
      toast.error("Alamat Lengkap wajib diisi!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_name: namaPelanggan,
        phone: noHp,
        address: alamat,
        type: orderType,
        package_speed: jenisLayanan,
        status: status,
        notes: keterangan
      };

      const res = await fetch(`/api/orders/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Order berhasil diperbarui!");
        if (onSuccess) onSuccess();
        else onClose();
      } else {
        toast.error(json.message || "Gagal memperbarui order");
      }
    } catch (e) {
      console.error('Error saving order:', e);
      toast.error("Terjadi kesalahan jaringan saat memperbarui order");
    } finally {
      setSaving(false);
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Edit3 size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
          Edit Order Pelanggan
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
          Perbarui data pesanan, status dispatch, atau paket layanan
        </p>
      </div>
    </div>
  );

  const footer = (
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
          onClick={handleSimpanOrder} 
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
            <span>Simpan Perubahan</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={footer} maxWidth="640px">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Nama Lengkap Pelanggan <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={namaPelanggan}
              onChange={(e) => setNamaPelanggan(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            No. WhatsApp / HP <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '0.85rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Alamat Lengkap <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#152C4A',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Tipe Layanan
          </label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white' }}
          >
            <option value="Pasang Baru">Pasang Baru</option>
            <option value="Perbaikan Gangguan">Perbaikan Gangguan</option>
            <option value="Pencabutan">Pencabutan</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Paket Kecepatan
          </label>
          <select
            value={jenisLayanan}
            onChange={(e) => setJenisLayanan(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', fontFamily: 'monospace' }}
          >
            <option value="10 Mbps">10 Mbps</option>
            <option value="20 Mbps">20 Mbps</option>
            <option value="30 Mbps">30 Mbps</option>
            <option value="50 Mbps">50 Mbps</option>
            <option value="100 Mbps">100 Mbps</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Status Order
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white' }}
          >
            <option value="Menunggu">Menunggu</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Batal">Batal</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Catatan Tambahan
        </label>
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Catatan instruksi khusus..."
          rows={2}
          style={{
            width: '100%',
            padding: '0.45rem 0.75rem',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            color: '#152C4A',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </Modal>
  );
};
