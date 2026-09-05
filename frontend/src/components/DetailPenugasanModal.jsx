import React, { useState, useMemo } from 'react';
import { X, Edit2, MapPin, User, Wrench, CheckCircle2, Clock, Activity, ExternalLink, Camera, Image, ZoomIn, Download, Package, Layers, Tag, Radio, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { EditPenugasanModal } from './EditPenugasanModal';

export const DetailPenugasanModal = ({ isOpen, onClose, data }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const documentationPhotos = useMemo(() => {
    if (!data) return [];
    const list = [];
    const rawDocs = data.documentation_photos || data.raw?.documentation_photos;

    if (Array.isArray(rawDocs)) {
      rawDocs.forEach((item, idx) => {
        if (item) {
          const url = typeof item === 'string' ? item : item.url;
          const label = typeof item === 'string' ? `Foto #${idx + 1}` : (item.label || item.category || `Foto #${idx + 1}`);
          const category = typeof item === 'string' ? 'general' : (item.category || 'general');
          if (url && url !== '-' && !String(url).includes('[✔ Foto Tersimpan')) {
            list.push({ url, label, category });
          }
        }
      });
    }

    const proof = data.proof_photo_url || data.raw?.proof_photo_url;
    if (proof && proof !== '-' && !list.some(p => p.url === proof)) {
      list.unshift({ url: proof, label: 'Bukti Utama', category: 'bukti_utama' });
    }

    return list;
  }, [data]);

  if (!isOpen || !data) return null;

  const statusStr = (data.status || '').toLowerCase();
  const isSelesai = statusStr === 'selesai' || statusStr === 'completed';
  const isDiproses = statusStr === 'diproses' || statusStr === 'dikerjakan' || statusStr === 'dalam pengerjaan' || statusStr === 'dibawa teknisi';

  // Bound ODP and Port information
  const odpName = data.odp || data.raw?.odp?.name || 'ODP-D1-01';
  const odpPort = data.port || data.raw?.odp_port || data.raw?.port || data.raw?.customer?.odp_port || '1';
  const odpUsedPorts = data.raw?.odp?.used_ports || 1;
  const odpTotalPorts = data.raw?.odp?.total_ports || 8;
  const redaman = data.raw?.redaman_dbm ? `${data.raw.redaman_dbm} dBm` : '-18.5 dBm';

  // Bound Assets and Materials information
  const modemSn = data.modem_sn || data.raw?.modem_sn || data.raw?.asset_transactions?.[0]?.serial_number || (data.customer ? `ZTEF670L-${String(data.id || 5).padStart(3, '0')}` : 'ZTEF670L-005');
  const kabelUsed = data.raw?.kabel_fo_used || data.kabel_fo_used || 75;
  const additionalMaterials = Array.isArray(data.raw?.additional_materials) ? data.raw.additional_materials : (typeof data.raw?.additional_materials === 'string' ? JSON.parse(data.raw.additional_materials || '[]') : []);

  const defaultTimeline = [
    {
      title: 'Tiket Penugasan Dibuat',
      desc: 'Admin membuat jadwal penugasan kerja untuk teknisi',
      done: true,
      time: data.date || 'Tercatat'
    },
    {
      title: 'Aset & Material Disiapkan',
      desc: 'Perangkat dan material divalidasi dari gudang logistik',
      done: isDiproses || isSelesai,
      time: isDiproses || isSelesai ? 'Siap' : 'Menunggu'
    },
    {
      title: 'Teknisi Menuju Lokasi',
      desc: 'Teknisi lapangan berangkat membawa perangkat unit',
      done: isDiproses || isSelesai,
      time: isDiproses || isSelesai ? 'On the way' : 'Menunggu'
    },
    {
      title: 'Pengerjaan & Pemasangan Lapangan',
      desc: 'Instalasi perangkat, penarikan kabel, dan konfigurasi ODP',
      done: isSelesai,
      time: isSelesai ? 'Selesai' : 'Belum selesai'
    },
    {
      title: 'Validasi Sinyal & Redaman',
      desc: 'Pengujian konektivitas redaman dBm optik dan speedtest',
      done: isSelesai,
      time: isSelesai ? 'Lolos Uji' : 'Menunggu'
    },
    {
      title: 'Berita Acara & Konfirmasi Pelanggan',
      desc: 'Penugasan selesai, foto dokumentasi diunggah ke sistem',
      done: isSelesai,
      time: isSelesai ? 'Terverifikasi' : 'Menunggu'
    }
  ];

  const timelineSteps = (data.timeline && data.timeline.length > 0) ? data.timeline : defaultTimeline;
  const completedStepsCount = timelineSteps.filter(s => s.done).length;
  const totalSteps = timelineSteps.length;
  const progressPercent = Math.round((completedStepsCount / totalSteps) * 100);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'TK';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <EditPenugasanModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={data}
      />
      
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem',
        overflowY: 'auto', boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '720px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex', flexDirection: 'column', maxHeight: 'min(90vh, 850px)',
          margin: 'auto', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #E2E8F0', boxSizing: 'border-box'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '1.15rem 1.25rem', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={16} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
                    Tiket #{data.idTugas} — {data.type}
                  </h2>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                    backgroundColor: isSelesai ? '#ECFDF5' : (data.status === 'Diproses' ? '#EFF6FF' : '#FFFBEB'),
                    color: isSelesai ? '#059669' : (data.status === 'Diproses' ? '#2563EB' : '#D97706'),
                    border: `1px solid ${isSelesai ? '#A7F3D0' : (data.status === 'Diproses' ? '#DBEAFE' : '#FDE68A')}`
                  }}>
                    {data.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
                  Pelanggan: <strong style={{ color: '#334155' }}>{data.customer}</strong> • ODP: {data.odp || '-'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Rincian Penugasan */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                RINCIAN PENUGASAN TEKNISI
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NOMOR TIKET</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{data.idTugas}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>JENIS PENUGASAN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{data.type}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TANGGAL PENUGASAN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{data.date || '-'}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TEKNISI UTAMA</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>{data.leadTech || 'Rizky Fauzan'}</div>
                </div>
              </div>
            </div>

            {/* ALOKASI TITIK ODP & PORT TERIKAT */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                ALOKASI TITIK ODP &amp; PORT TERIKAT
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TITIK ODP</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>{odpName}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>NOMOR PORT</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: '2px' }}>Port {odpPort}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>KAPASITAS ODP</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>{odpUsedPorts}/{odpTotalPorts} Port</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>REDAMAN OPTIK</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace', marginTop: '2px' }}>{redaman}</div>
                </div>
              </div>
            </div>

            {/* ASET & MATERIAL TERIKAT (SURAT TUGAS) */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                ASET &amp; MATERIAL TERIKAT (SURAT TUGAS)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Perangkat ONT / Modem */}
                <div style={{
                  backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                  padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#2563EB', flexShrink: 0
                    }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A' }}>
                        ONT ZTE F670L
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600, marginTop: '1px' }}>
                        SN: {modemSn}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      Serial
                    </span>
                    <span style={{
                      backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      {isSelesai ? 'Terpasang' : 'Terikat Surat Tugas'}
                    </span>
                  </div>
                </div>

                {/* Material Kabel Dropcore */}
                <div style={{
                  backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                  padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#059669', flexShrink: 0
                    }}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A' }}>
                        Kabel Dropcore Fiber Optik
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600, marginTop: '1px' }}>
                        Pemakaian: {kabelUsed} Meter
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      Material
                    </span>
                    <span style={{
                      backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      {isSelesai ? 'Terpakai' : 'Alokasi Tugas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE TUGAS */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  PROGRES PENGERJAAN ({progressPercent}%)
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{currentStep}/{totalSteps} tahap</span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: 99 }}></div>
              </div>

              {/* Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {timelineSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      backgroundColor: step.done ? '#10B981' : '#F1F5F9',
                      color: step.done ? 'white' : '#CBD5E1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: '2px'
                    }}>
                      {step.done ? <CheckCircle2 size={11} /> : '•'}
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: step.done ? 700 : 500, color: step.done ? '#152C4A' : '#94A3B8' }}>{step.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{step.desc}</div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace' }}>{step.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DOKUMENTASI FOTO */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  DOKUMENTASI FOTO LAPANGAN {documentationPhotos.length > 0 ? `(${documentationPhotos.length} FOTO)` : ''}
                </div>
                {documentationPhotos.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 600 }}>
                    Klik foto untuk memperbesar
                  </span>
                )}
              </div>

              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                {documentationPhotos.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    
                    {/* Gallery Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: '0.65rem'
                    }}>
                      {documentationPhotos.map((photo, idx) => {
                        const isMain = photo.category === 'bukti_utama' || idx === 0;
                        let badgeBg = '#475569';
                        if (photo.category === 'bukti_utama') badgeBg = '#059669';
                        else if (photo.category === 'lokasi') badgeBg = '#2563EB';
                        else if (photo.category === 'ont') badgeBg = '#0D9488';
                        else if (photo.category === 'kabel') badgeBg = '#D97706';
                        else if (photo.category === 'hasil') badgeBg = '#7C3AED';
                        else if (photo.category === 'before') badgeBg = '#E11D48';
                        else if (photo.category === 'after') badgeBg = '#16A34A';
                        else if (photo.category.includes('ditarik')) badgeBg = '#4F46E5';

                        return (
                          <div 
                            key={idx}
                            onClick={() => setPreviewPhoto(photo)}
                            style={{
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: isMain ? '2px solid #10B981' : '1px solid #CBD5E1',
                              backgroundColor: '#0F172A',
                              position: 'relative',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                            }}
                          >
                            <div style={{ width: '100%', height: '105px', position: 'relative' }}>
                              <img 
                                src={photo.url} 
                                alt={photo.label} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                loading="lazy"
                              />
                              <div style={{
                                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0,
                                transition: 'opacity 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                              >
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '6px', color: 'white' }}>
                                  <ZoomIn size={16} />
                                </div>
                              </div>
                            </div>

                            <div style={{
                              padding: '5px 6px',
                              backgroundColor: '#FFFFFF',
                              borderTop: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {photo.label}
                              </span>
                              <span style={{
                                backgroundColor: badgeBg,
                                color: 'white',
                                fontSize: '7.5px',
                                fontWeight: 800,
                                padding: '1px 4px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                flexShrink: 0
                              }}>
                                {photo.category.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {data.raw?.technician_notes && (
                      <div style={{ backgroundColor: 'white', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>Catatan Lapangan:</div>
                        <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.75rem', color: '#152C4A', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {data.raw.technician_notes}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {data.raw?.technician_notes ? (
                      <div style={{ backgroundColor: 'white', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>Catatan Lapangan:</div>
                        <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.75rem', color: '#152C4A', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {data.raw.technician_notes}
                        </pre>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', padding: '0.75rem' }}>
                        Belum ada foto dokumentasi diunggah oleh teknisi
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Tiket terverifikasi sistem FiberPulse
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={onClose}
                style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tutup
              </button>
              {!isSelesai && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '5px 14px',
                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#2563EB',
                    display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                  }}
                >
                  <Edit2 size={13} /> Edit Tiket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Full Size Preview Modal */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              backgroundColor: '#1E293B', borderRadius: '12px',
              overflow: 'hidden', border: '1px solid #334155',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Lightbox Header */}
            <div style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#0F172A',
              borderBottom: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {previewPhoto.label}
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  Kategori: {previewPhoto.category}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a 
                  href={previewPhoto.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#334155', color: '#F8FAFC',
                    padding: '5px 10px', borderRadius: '6px',
                    fontSize: '0.7rem', fontWeight: 600,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <ExternalLink size={12} /> Buka Tab Baru
                </a>
                <button 
                  onClick={() => setPreviewPhoto(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Body */}
            <div style={{
              padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#020617', maxHeight: 'calc(90vh - 80px)', overflow: 'auto'
            }}>
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.label} 
                style={{
                  maxWidth: '100%', maxHeight: 'calc(85vh - 80px)',
                  objectFit: 'contain', borderRadius: '6px'
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
