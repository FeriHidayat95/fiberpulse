import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, Info, Loader2, CreditCard, ShoppingBag, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { SearchableSelect } from './SearchableSelect';
import toast from 'react-hot-toast';

export const TambahOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState('baru'); // 'baru' | 'lama'
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [jenisLayanan, setJenisLayanan] = useState('Pemasangan');
  const [paketLayanan, setPaketLayanan] = useState('20 Mbps');
  const [keterangan, setKeterangan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [nik, setNik] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab('baru');
      setCustomerId('');
      setJenisLayanan('Pemasangan');
      setPaketLayanan('20 Mbps');
      setKeterangan('');
      setNamaPelanggan('');
      setNoHp('');
      setAlamat('');
      setNik('');
      setIsSubmitting(false);

      fetch('/api/customers')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setCustomers(data.data);
          }
        })
        .catch(err => console.error("Error fetching customers:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimpanOrder = async () => {
    if (tab === 'baru') {
      if (!namaPelanggan.trim()) {
        toast.error("Nama Pelanggan wajib diisi!");
        return;
      }
      if (!nik.trim()) {
        toast.error("Field NIK Pelanggan wajib diisi!");
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
    } else {
      if (!customerId) {
        toast.error("Silakan pilih Pelanggan Aktif terlebih dahulu!");
        return;
      }
    }

    if (jenisLayanan !== 'Pemasangan' && !keterangan.trim()) {
      toast.error(`Keterangan mengenai ${jenisLayanan.toLowerCase()} wajib diisi!`);
      return;
    }

    setIsSubmitting(true);
    
    const dusunMatch = alamat.match(/Dusun\s+\d+/i);
    const dusun = dusunMatch ? dusunMatch[0] : 'Umum';

    try {
      const selectedCustObj = customers.find(c => c.id == customerId);
      const speed = jenisLayanan === 'Pemasangan' ? paketLayanan : (selectedCustObj?.package_speed || '20 Mbps');
      const orderType = jenisLayanan === 'Pemasangan' 
        ? 'Pasang Baru' 
        : (jenisLayanan === 'Pemeliharaan' ? 'Perbaikan Gangguan' : 'Pencabutan');

      const payload = {
        type: orderType,
        package_speed: speed,
        notes: keterangan || `Layanan: ${jenisLayanan}`,
        status: 'Menunggu Teknisi'
      };

      if (tab === 'lama') {
        payload.customer_id = customerId;
      } else {
        payload.customer_name = namaPelanggan;
        payload.phone = noHp;
        payload.address = alamat;
        payload.dusun = dusun;
        if (nik) payload.nik = nik;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && (resData.success || resData.id)) {
        toast.success("Order baru berhasil didaftarkan!");
        if (onSuccess) onSuccess();
        else onClose();
      } else {
        toast.error(resData.message || "Gagal menyimpan order.");
      }
    } catch (e) {
      console.error('Error saving order:', e);
      toast.error("Terjadi kesalahan koneksi saat menyimpan order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBag size={16} />
      </div>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
          Tambah Order Baru
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
          Pendaftaran pesanan pasang baru, perbaikan gangguan, atau pencabutan
        </p>
      </div>
    </div>
  );

  const footerContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>* Field wajib diisi</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onClose} 
          disabled={isSubmitting}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button 
          type="button" 
          onClick={handleSimpanOrder} 
          disabled={isSubmitting}
          className="sgt-btn-primary"
          style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Order</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customTitle} footer={footerContent} maxWidth="680px">
      
      {/* Tab Switcher */}
      <div style={{
        display: 'inline-flex',
        backgroundColor: '#F1F5F9',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        marginBottom: '1.25rem'
      }}>
        <button
          type="button"
          onClick={() => { setTab('baru'); setJenisLayanan('Pemasangan'); }}
          style={{
            padding: '5px 14px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: tab === 'baru' ? '#FFFFFF' : 'transparent',
            color: tab === 'baru' ? '#2563EB' : '#64748B',
            boxShadow: tab === 'baru' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            borderRadius: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          Pelanggan Baru
        </button>
        <button
          type="button"
          onClick={() => { setTab('lama'); setJenisLayanan('Pemeliharaan'); }}
          style={{
            padding: '5px 14px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: tab === 'lama' ? '#FFFFFF' : 'transparent',
            color: tab === 'lama' ? '#2563EB' : '#64748B',
            boxShadow: tab === 'lama' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            borderRadius: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          Pelanggan Lama / Terdaftar
        </button>
      </div>

      {tab === 'baru' ? (
        <>
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
                  placeholder="Contoh: Ratna Fatmawati"
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
                  placeholder="081234567890"
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Alamat Lengkap Pemasangan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: Dusun 2 RT 04 RW 02 Desa Jati"
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

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              NIK Pelanggan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="3204010101800007"
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Pilih Pelanggan Terdaftar <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <SearchableSelect
            value={customerId}
            onChange={setCustomerId}
            options={customers.map(c => ({
              value: c.id.toString(),
              label: `${c.name} (${c.phone}) - ${c.address}`
            }))}
            placeholder="Cari & Pilih Pelanggan Aktif..."
          />
        </div>
      )}

      {/* Jenis Layanan & Paket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Jenis Layanan <span style={{ color: '#EF4444' }}>*</span>
          </label>
          {tab === 'baru' ? (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                disabled
                value="Pemasangan (Pasang Baru)"
                title="Layanan untuk pelanggan baru otomatis ditetapkan sebagai Pasang Baru"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#475569',
                  outline: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#F1F5F9',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ) : (
            <select
              value={jenisLayanan}
              onChange={(e) => setJenisLayanan(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#152C4A',
                outline: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="Pemeliharaan">Pemeliharaan (Gangguan / Perbaikan)</option>
              <option value="Pencabutan">Pencabutan (Berhenti Berlangganan)</option>
              <option value="Pemasangan">Pemasangan (Tambah Layanan / Pindah)</option>
            </select>
          )}
        </div>

        {((tab === 'baru') || jenisLayanan === 'Pemasangan') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Paket Kecepatan
            </label>
            <select
              value={paketLayanan}
              onChange={(e) => setPaketLayanan(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#152C4A',
                outline: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="10 Mbps">10 Mbps</option>
              <option value="20 Mbps">20 Mbps</option>
              <option value="30 Mbps">30 Mbps</option>
              <option value="50 Mbps">50 Mbps</option>
              <option value="100 Mbps">100 Mbps</option>
            </select>
          </div>
        )}
      </div>

      {tab !== 'baru' && jenisLayanan !== 'Pemasangan' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
            Keterangan / Detail Gangguan <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder={`Detail keterangan mengenai ${jenisLayanan.toLowerCase()}...`}
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
      )}
    </Modal>
  );
};
