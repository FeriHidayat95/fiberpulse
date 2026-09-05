import React, { useState, useEffect } from 'react';
import { X, Edit, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const EditAsetMasukModal = ({ isOpen, onClose, onSave, transactionData }) => {
  const [jumlahStok, setJumlahStok] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && transactionData) {
      setJumlahStok(transactionData.quantity || '');
    }
  }, [isOpen, transactionData]);

  if (!isOpen || !transactionData) return null;

  const handleSimpanStok = async () => {
    if (!jumlahStok || Number(jumlahStok) <= 0) {
      toast.error("Mohon masukkan jumlah stok yang valid!");
      return;
    }
    setSaving(true);
    
    try {
      const res = await fetch(`/api/assets/transactions/${transactionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          quantity: Number(jumlahStok)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Transaksi masuk berhasil diperbarui!");
        onSave();
        onClose();
      } else {
        toast.error(data.message || "Gagal memperbarui transaksi.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', border: '1px solid #E2E8F0',
        boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
                Edit Transaksi Masuk
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                Penyesuaian kuantitas transaksi logistik
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Nama Aset
            </label>
            <input 
              value={transactionData.asset_name || 'Aset'} 
              disabled 
              style={{
                width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #E2E8F0',
                borderRadius: '8px', backgroundColor: '#F8FAFC', color: '#64748B',
                fontSize: '0.75rem', fontWeight: 600, boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Jumlah Stok Masuk <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="number"
              value={jumlahStok}
              onChange={(e) => setJumlahStok(e.target.value)}
              placeholder="0"
              style={{
                width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                borderRadius: '8px', color: '#152C4A', fontSize: '0.85rem', fontWeight: 800,
                fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#F8FAFC' }}>
          <button 
            onClick={onClose} 
            disabled={saving}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button 
            onClick={handleSimpanStok} 
            disabled={saving}
            className="sgt-btn-primary"
            style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}
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
    </div>
  );
};
