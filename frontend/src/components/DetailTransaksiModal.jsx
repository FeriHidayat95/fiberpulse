import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, Package, Camera, Download, ZoomIn, Image as ImageIcon, FileText, CheckCircle2, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle, ShieldCheck, Clock, Wrench, ExternalLink } from 'lucide-react';

export const DetailTransaksiModal = ({ isOpen, onClose, data }) => {
  const navigate = useNavigate();
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  if (!isOpen || !data) return null;

  const raw = data.raw || {};
  const isMasuk = raw.type === 'Masuk' || data.type === 'Masuk' || !String(data.type || '').toLowerCase().includes('keluar');
  const isCabutan = raw.technician_id != null || (raw.notes && String(raw.notes).toLowerCase().includes('cabutan'));

  const taskId = raw.task_id || data.task_id || (raw.task ? raw.task.id : null);
  const taskTicket = raw.task?.ticket_number || (raw.notes && raw.notes.match(/#([A-Za-z0-9\-]+)/) ? raw.notes.match(/#([A-Za-z0-9\-]+)/)[1] : null);

  const handleLihatPenugasan = () => {
    onClose();
    if (taskId) {
      navigate(`/admin/penugasan?id=${taskId}`);
    } else if (taskTicket) {
      navigate(`/admin/penugasan?ticket=${encodeURIComponent(taskTicket)}`);
    } else if (raw.customer_name && raw.customer_name !== '-' && raw.customer_name !== 'Pelanggan Operasional') {
      navigate(`/admin/penugasan?search=${encodeURIComponent(raw.customer_name)}`);
    } else if (raw.technician_name && raw.technician_name !== '-' && !String(raw.technician_name).toLowerCase().includes('admin')) {
      navigate(`/admin/penugasan?search=${encodeURIComponent(raw.technician_name)}`);
    } else {
      navigate('/admin/penugasan');
    }
  };

  let photoUrl = raw.photo_url || data.photo_url;
  if (!photoUrl && isCabutan) {
    const lowerName = String(data.name || data.nama || '').toLowerCase() + ' ' + String(data.type || '').toLowerCase();
    if (lowerName.includes('kabel') || lowerName.includes('fo') || lowerName.includes('optic') || lowerName.includes('optik') || lowerName.includes('meter') || lowerName.includes('drop')) {
      photoUrl = '/lampiran-fo.svg';
    } else if (lowerName.includes('router') || lowerName.includes('wireless') || lowerName.includes('ap')) {
      photoUrl = '/lampiran-router.svg';
    } else {
      photoUrl = '/lampiran-ont.svg';
    }
  }

  const dateValue = raw.created_at || data.tanggal || data.created_at;
  const dateStr = dateValue ? new Date(dateValue).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '-';

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem 1rem', overflowY: 'auto', boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex', flexDirection: 'column', maxHeight: 'min(90vh, 850px)',
          margin: 'auto', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #E2E8F0', animation: 'fadeIn 0.2s ease-out'
        }}>
          
          {/* Header */}
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: isMasuk ? '#ECFDF5' : '#EFF6FF', color: isMasuk ? '#059669' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMasuk ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.01em' }}>
                  Transaksi #{raw.id || data.id || '101'} — {data.name || data.nama}
                </h2>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                  Merk: <strong style={{color: '#334155'}}>{data.merk || raw.asset_brand || 'General'}</strong> • Kategori: <strong style={{color: '#334155'}}>{data.type || raw.asset_category || 'Consumable'}</strong>
                </p>
              </div>
            </div>

            <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* INFORMASI TRANSAKSI */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={13} color="#2563EB" /> RINCIAN DATA TRANSAKSI
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>JUMLAH / VOLUME</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: isMasuk ? '#059669' : '#2563EB', fontFamily: 'monospace' }}>{data.qty || data.jumlah || '1 Unit'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>TANGGAL &amp; WAKTU</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>{dateStr}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>SUMBER / ASAL</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>
                    {raw.customer_name && raw.customer_name !== '-' ? `Asal: ${raw.customer_name}` : (isCabutan ? 'Cabutan Pelanggan' : 'Supplier Resmi / Vendor')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>TEKNISI / PIC</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} color="#64748B" /> {raw.technician_name || data.technician_name || 'Admin Logistik'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>STATUS FISIK UNIT</div>
                  <div>
                    {String(data.status || raw.status || raw.status_label || '').toLowerCase().includes('dibawa') || String(data.status || raw.status || raw.status_label || '').toLowerCase().includes('teknisi') ? (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> Dibawa Teknisi
                      </span>
                    ) : String(data.status || raw.status || raw.status_label || '').toLowerCase().includes('terpasang') ? (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={10} /> Terpasang di Pelanggan
                      </span>
                    ) : (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={10} /> {data.status || raw.status || 'Tersedia'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Serial Number & Tahun Pembuatan (If Available / Serial Asset) */}
                {(raw.serial_number || data.serial_number) && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>SERIAL NUMBER (SN)</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>
                      {raw.serial_number || data.serial_number}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '2px', fontWeight: 700 }}>TAHUN PEMBUATAN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>
                    {data.year || data.tahun || raw.year || raw.tahun || (raw.notes && raw.notes.match(/Tahun[^\d]*(\d{4})/i) ? raw.notes.match(/Tahun[^\d]*(\d{4})/i)[1] : (raw.created_at ? new Date(raw.created_at).getFullYear() : '2026'))}
                  </div>
                </div>
              </div>
            </div>

            {/* CATATAN / KETERANGAN */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#152C4A', marginBottom: '2px' }}>
                  CATATAN &amp; KETERANGAN LOGISTIK
                </div>
                <div style={{ fontSize: '0.725rem', color: '#475569', lineHeight: 1.4, fontWeight: 500 }}>
                  {raw.notes || (isCabutan ? `Barang hasil pencabutan dari lokasi pelanggan ${raw.customer_name || ''}, telah diverifikasi oleh tim gudang.` : 'Pencatatan transaksi penambahan/pengurangan stok reguler gudang FiberPulse.')}
                </div>
              </div>
            </div>

            {/* BUKTI FOTO TRANSAKSI */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Camera size={13} color="#2563EB" /> LAMPIRAN FOTO FISIK
                </div>
                <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={10} /> Terverifikasi Lapangan
                </span>
              </div>

              {photoUrl ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0F172A', position: 'relative' }}>
                  <div style={{ height: '200px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#1E293B' }}>
                    <img 
                      src={photoUrl} alt="Bukti Lampiran" loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ padding: '0.65rem 1rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#152C4A' }}>
                        Bukti Lampiran Fisik Perangkat
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 500 }}>
                        PIC: {raw.technician_name || 'Teknisi FiberPulse'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => setLightboxPhoto({ url: photoUrl, title: `Bukti Transaksi #${raw.id || data.id}`, subtitle: `${data.name || data.nama} (${data.qty || data.jumlah})` })}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#2563EB', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ZoomIn size={12} /> Zoom
                      </button>
                      <a 
                        href={photoUrl} target="_blank" rel="noopener noreferrer" download
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#152C4A', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} /> Unduh
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', color: '#64748B' }}>
                  <ImageIcon size={28} style={{ margin: '0 auto 0.25rem auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Tidak ada lampiran foto</p>
                  <span style={{ fontSize: '0.7rem' }}>Transaksi reguler tanpa bukti foto cabutan</span>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              <ShieldCheck size={13} color="#059669" />
              <span>Ledger Mutasi Stok FiberPulse</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={handleLihatPenugasan}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem',
                  display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
              >
                <Wrench size={13} color="#2563EB" />
                <span>Lihat Penugasan</span>
                <ExternalLink size={11} color="#2563EB" />
              </button>

              <button 
                onClick={onClose}
                style={{
                  padding: '6px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#334155', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem'
                }}
              >
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(6px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            style={{
              backgroundColor: '#1E293B', borderRadius: '16px', overflow: 'hidden',
              maxWidth: '700px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#F8FAFC', margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="#3B82F6" /> {lightboxPhoto.title}
                </h3>
                <p style={{ color: '#94A3B8', margin: '2px 0 0 0', fontSize: '0.75rem' }}>{lightboxPhoto.subtitle}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <a 
                  href={lightboxPhoto.url} target="_blank" rel="noopener noreferrer" download
                  style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#334155', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} /> Unduh
                </a>
                <button 
                  onClick={() => setLightboxPhoto(null)}
                  style={{ background: '#EF4444', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', minHeight: '300px', maxHeight: '75vh', overflow: 'hidden' }}>
              <img 
                src={lightboxPhoto.url} alt="Bukti Foto" loading="lazy"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
