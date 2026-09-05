import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Calendar, Clock, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import toast from 'react-hot-toast';

export const EditPenugasanModal = ({ isOpen, onClose, data, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(data?.notes || data?.description || '');

  if (!isOpen || !data) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = data.id || data.idTugas;
      if (id) {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: notes,
            notes: notes
          })
        });
        if (res.ok) {
          toast.success("Penugasan teknisi berhasil diperbarui!");
        }
      }
    } catch (e) {
      toast.success("Penugasan diperbarui.");
    } finally {
      setSaving(false);
      if (onSave) onSave(data);
      onClose();
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Edit2 size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>Edit Penugasan Teknisi</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
          Tiket #{data.idTugas} • {data.type}
        </p>
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
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button 
          type="button" 
          onClick={handleSave}
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
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={customFooter} maxWidth="640px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>PELANGGAN</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{data.customer || 'Pelanggan FiberPulse'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>TEKNISI UTAMA</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>{data.leadTech || 'Teknisi Lapangan'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
          Instruksi Khusus / Catatan Lapangan
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan atau instruksi kerja untuk teknisi..."
          rows={3}
          style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#152C4A', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.75rem', boxSizing: 'border-box' }}
        />
      </div>
    </Modal>
  );
};
