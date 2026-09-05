import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const TambahTeknisiModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teknisi');
  const [status, setStatus] = useState('Aktif');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || '');
      setEmail(initialData.email || '');
      setNoHp(initialData.noHp || '');
      setPassword('');
      setRole(initialData.role || 'teknisi');
      setStatus(initialData.status || 'Aktif');
    } else {
      setNama('');
      setEmail('');
      setNoHp('');
      setPassword('');
      setRole('teknisi');
      setStatus('Aktif');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!initialData;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!nama.trim()) {
      toast.error('Mohon lengkapi Nama Lengkap!');
      return;
    }
    if (!email.trim()) {
      toast.error('Mohon lengkapi Alamat Email!');
      return;
    }
    if (!isEdit && (!password || password.length < 6)) {
      toast.error('Password akun minimal 6 karakter!');
      return;
    }

    setSaving(true);
    try {
      if (onSave) {
        const success = await onSave({
          id: initialData ? initialData.id : Date.now(),
          nama: nama.trim(),
          email: email.trim(),
          noHp: noHp.trim(),
          password: password ? password.trim() : undefined,
          role,
          status
        });
        if (success !== false) {
          onClose();
        }
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Error saat menyimpan akun:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', border: '1px solid #E2E8F0'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isEdit ? <UserCheck size={16} /> : <UserPlus size={16} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A', letterSpacing: '-0.02em' }}>
                {isEdit ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                {isEdit ? 'Perbarui informasi dan role akses sistem' : 'Registrasi akun staf atau teknisi lapangan baru'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 0 }}>
          
          {/* Scrollable Body Form */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nama Lengkap <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input 
                required
                placeholder="Contoh: Budi Santoso" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                style={{
                  width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                  borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                  backgroundColor: '#FFFFFF', fontWeight: 600, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Alamat Email <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input 
                required
                type="email"
                placeholder="email@fiberpulse.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                  borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                  backgroundColor: '#FFFFFF', fontWeight: 600, fontFamily: 'monospace', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nomor WhatsApp <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input 
                required
                placeholder="08123456789" 
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                style={{
                  width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                  borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                  backgroundColor: '#FFFFFF', fontWeight: 600, fontFamily: 'monospace', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                {isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Akun'} {!isEdit && <span style={{ color: '#EF4444' }}>*</span>}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  required={!isEdit}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEdit ? '••••••••' : 'Minimal 6 karakter'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.45rem 2.4rem 0.45rem 0.75rem', border: '1px solid #CBD5E1',
                    borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                    backgroundColor: '#FFFFFF', fontWeight: 600, boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  aria-label={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  style={{ 
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', 
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                    borderRadius: '4px', lineHeight: 1
                  }}
                >
                  {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Role Akses
                </label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                    borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                    backgroundColor: '#FFFFFF', fontWeight: 600
                  }}
                >
                  <option value="admin">Administrator / Super Admin</option>
                  <option value="admin_gudang">Admin Gudang</option>
                  <option value="kepala_gudang">Kepala Teknisi Gudang</option>
                  <option value="teknisi">Teknisi Lapangan</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Status Akun
                </label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1',
                    borderRadius: '8px', color: '#152C4A', outline: 'none', fontSize: '0.8rem',
                    backgroundColor: '#FFFFFF', fontWeight: 600
                  }}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer inside form */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#F8FAFC' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={saving}
              style={{
                padding: '7px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={saving}
              className="sgt-btn-primary"
              style={{
                padding: '8px 18px', borderRadius: '8px', border: 'none',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Akun Baru'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
