import React, { useState, useEffect } from 'react';
import { X, Edit2, CheckCircle2, Clock, MapPin, User, Wrench, Navigation, Radio, ShieldCheck, Camera, ZoomIn, Phone, MessageSquare, ExternalLink, Calendar, Package } from 'lucide-react';
import { get } from 'idb-keyval';

export const DetailOrderModal = ({ isOpen, onClose, data }) => {
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [localDocPhotos, setLocalDocPhotos] = useState([]);

  useEffect(() => {
    if (!isOpen || !data) return;

    const taskId = data.taskId || data.id;
    if (taskId) {
      get(`docPhotos_${taskId}`).then((saved) => {
        if (saved && typeof saved === 'object') {
          const photos = [];
          Object.keys(saved).forEach(cat => {
            if (Array.isArray(saved[cat])) {
              saved[cat].forEach(file => {
                if (file) {
                  photos.push({
                    category: cat,
                    url: typeof file === 'string' ? file : (file.url || (file instanceof Blob ? URL.createObjectURL(file) : null))
                  });
                }
              });
            }
          });
          if (photos.length > 0) setLocalDocPhotos(photos);
        }
      }).catch(() => {});
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const getLayananStyle = (layanan) => {
    const l = String(layanan || '').toLowerCase();
    if (l.includes('pemeliharaan') || l.includes('perbaikan') || l.includes('gangguan')) {
      return { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' };
    }
    if (l.includes('pencabutan') || l.includes('berhenti')) {
      return { backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' };
    }
    return { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'TK';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const orderStatus = String(data.status || 'Pending');
  const isSelesai = orderStatus === 'Selesai';
  const isProses = orderStatus === 'Proses' || orderStatus === 'Dikerjakan' || orderStatus === 'Diproses';

  const techName = data.technicianName || data.teknisi || data.raw?.technician?.name || data.raw?.technician_name || 'Rizky Fauzan (TK-01)';
  const techPhone = data.technicianPhone || data.raw?.technician?.phone || '081234567890';

  const timelineSteps = [
    {
      id: 1,
      title: 'Order Dibuat & Diterima Sistem',
      desc: `Pesanan ${data.noPesanan} tercatat di sistem FiberPulse.`,
      time: `${data.tanggal || '2026-07-31'} 08:30 WIB`,
      status: 'completed',
      icon: CheckCircle2
    },
    {
      id: 2,
      title: 'Penugasan Tim Teknisi Lapangan',
      desc: `Teknisi ${techName} ditugaskan untuk penanganan.`,
      time: `${data.tanggal || '2026-07-31'} 09:14 WIB`,
      status: isSelesai || isProses ? 'completed' : 'pending',
      icon: User
    },
    {
      id: 3,
      title: 'Teknisi Dalam Perjalanan Menuju Lokasi',
      desc: `Petugas berangkat menuju alamat pelanggan (${data.alamat || 'Wilayah Operasional'}).`,
      time: `${data.tanggal || '2026-07-31'} 09:40 WIB`,
      status: isSelesai || isProses ? 'completed' : 'pending',
      icon: Navigation
    },
    {
      id: 4,
      title: 'Instalasi & Terminasi Lapangan',
      desc: 'Penarikan kabel FO, koneksi ODP, pencatatan redaman dBm & konfigurasi.',
      time: `${data.tanggal || '2026-07-31'} 10:15 WIB`,
      status: isSelesai ? 'completed' : (isProses ? 'active' : 'pending'),
      icon: Radio
    },
    {
      id: 5,
      title: 'Pengerjaan Selesai & Terverifikasi',
      desc: 'Dokumentasi foto & GPS presisi tersimpan. Layanan internet aktif.',
      time: `${data.tanggal || '2026-07-31'} 11:00 WIB`,
      status: isSelesai ? 'completed' : 'pending',
      icon: ShieldCheck
    }
  ];

  const mainPhoto = data.proof_photo_url || data.raw?.proof_photo_url;
  const allPhotos = [];
  if (mainPhoto) {
    allPhotos.push({ label: 'Bukti Utama', url: mainPhoto });
  }

  // Include documentation_photos from backend
  const serverDocPhotos = data.documentation_photos || data.raw?.documentation_photos;
  if (Array.isArray(serverDocPhotos)) {
    serverDocPhotos.forEach((p, idx) => {
      const url = typeof p === 'string' ? p : p?.url;
      const label = typeof p === 'string' ? `Foto Dokumentasi #${idx + 1}` : (p?.label || p?.category || `Foto #${idx + 1}`);
      if (url && url !== mainPhoto && !allPhotos.some(item => item.url === url)) {
        allPhotos.push({ label, url });
      }
    });
  }

  localDocPhotos.forEach(p => {
    if (p.url && p.url !== mainPhoto && !allPhotos.some(item => item.url === p.url)) {
      allPhotos.push({ label: `${p.category || 'Dokumentasi'}`, url: p.url });
    }
  });

  let materialItems = [];
  if (Array.isArray(data.items) && data.items.length > 0) {
    materialItems = data.items.map(it => ({
      nama: it.nama || it.name || 'Aset',
      jumlah: it.jumlah || it.qty || 1,
      status: it.status || 'Terpasang'
    }));
  } else if (Array.isArray(data.additional_materials) && data.additional_materials.length > 0) {
    materialItems = data.additional_materials.map(it => ({
      nama: it.name || 'Aset Consumable',
      jumlah: `${it.qty || 1} ${it.unit || 'Unit'}`,
      status: 'Terpakai (Stok Terpotong)'
    }));
  } else if (Array.isArray(data.raw?.additional_materials) && data.raw.additional_materials.length > 0) {
    materialItems = data.raw.additional_materials.map(it => ({
      nama: it.name || 'Aset Consumable',
      jumlah: `${it.qty || 1} ${it.unit || 'Unit'}`,
      status: 'Terpakai (Stok Terpotong)'
    }));
  } else {
    materialItems = [
      { nama: 'ONT Dual Band Wi-Fi 6 (Modem Router)', jumlah: '1 Unit', status: 'Terpasang' },
      { nama: 'Kabel Drop FO 1 Core (Dropcore Fiber Optic)', jumlah: '150 Meter', status: 'Terpakai' }
    ];
  }

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
          border: '1px solid #E2E8F0', boxSizing: 'border-box'
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={16} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
                    Detail Order — {data.noPesanan}
                  </h2>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                    backgroundColor: isSelesai ? '#ECFDF5' : (isProses ? '#EFF6FF' : '#FFFBEB'),
                    color: isSelesai ? '#059669' : (isProses ? '#2563EB' : '#D97706'),
                    border: `1px solid ${isSelesai ? '#A7F3D0' : (isProses ? '#DBEAFE' : '#FDE68A')}`
                  }}>
                    {orderStatus}
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                  Pelanggan: <strong style={{ color: '#334155' }}>{data.nama}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9', border: 'none', borderRadius: '6px',
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748B'
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* INFORMASI PELANGGAN & ORDER */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                RINCIAN ORDER &amp; DATA PELANGGAN
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NAMA PELANGGAN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{data.nama}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NOMOR PESANAN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{data.noPesanan}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TANGGAL ORDER</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{data.tanggal}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NO. TELEPON / WA</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace', marginTop: '2px' }}>{data.noHp}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>ALAMAT PEMASANGAN</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#152C4A', marginTop: '2px' }}>{data.alamat}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>JENIS LAYANAN</div>
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, ...getLayananStyle(data.layanan) }}>
                      {data.layanan}
                    </span>
                  </div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>PAKET INTERNET</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{data.paket}</div>
                </div>
              </div>
            </div>

            {/* TIM TEKNISI PIC */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                TEKNISI PENANGGUNG JAWAB
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#152C4A', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
                  }}>
                    {getInitials(techName)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A' }}>
                      {techName}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 500 }}>
                      Tiket: {data.taskId ? `TK-${data.taskId}` : 'TK-01'}
                    </div>
                  </div>
                </div>

                {techPhone && techPhone !== '-' && (
                  <a 
                    href={`https://wa.me/62${techPhone.replace(/^0/, '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: '6px',
                      fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <MessageSquare size={12} /> WhatsApp Teknisi
                  </a>
                )}
              </div>
            </div>

            {/* TIMELINE */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                PROGRES PENGERJAAN LAPANGAN
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', paddingLeft: '4px' }}>
                {timelineSteps.map((step, idx) => {
                  const IconComp = step.icon;
                  const isDone = step.status === 'completed';
                  const isActive = step.status === 'active';

                  return (
                    <div key={step.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative', paddingBottom: idx === timelineSteps.length - 1 ? '0' : '1rem' }}>
                      {idx !== timelineSteps.length - 1 && (
                        <div style={{
                          position: 'absolute', top: '20px', left: '10px', width: '2px', height: 'calc(100% - 10px)',
                          backgroundColor: isDone ? '#10B981' : '#E2E8F0', zIndex: 1
                        }} />
                      )}

                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        backgroundColor: isDone ? '#10B981' : (isActive ? '#2563EB' : '#F1F5F9'),
                        color: isDone || isActive ? 'white' : '#94A3B8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2, flexShrink: 0
                      }}>
                        <IconComp size={12} strokeWidth={2.5} />
                      </div>

                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: isDone || isActive ? 800 : 600, color: isDone || isActive ? '#152C4A' : '#94A3B8' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isDone || isActive ? '#475569' : '#94A3B8', marginTop: '1px', fontWeight: 500 }}>
                            {step.desc}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isDone ? '#059669' : (isActive ? '#2563EB' : '#94A3B8'), whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                          {step.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BUKTI FOTO */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                DOKUMENTASI FOTO LAPANGAN
              </div>

              {allPhotos.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {allPhotos.map((photo, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{
                        width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden',
                        border: '1px solid #CBD5E1', position: 'relative',
                        cursor: 'pointer', backgroundColor: '#0F172A'
                      }}
                      onClick={() => setLightboxUrl(photo.url)}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.label} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <span style={{
                        position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: '#059669', color: 'white', fontSize: '7.5px', fontWeight: 800,
                        padding: '1px 4px', borderRadius: '4px', whiteSpace: 'nowrap'
                      }}>
                        {photo.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, textAlign: 'center', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                  Belum ada lampiran foto dokumentasi dari teknisi
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1',
                padding: '5px 14px', borderRadius: '6px', fontSize: '0.75rem',
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              Tutup Detail
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(6px)'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxUrl} 
              alt="Preview Foto" 
              style={{ width: '100%', height: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute', top: '-12px', right: '-12px',
                backgroundColor: '#EF4444', color: 'white', border: 'none',
                borderRadius: '6px', width: '28px', height: '28px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
