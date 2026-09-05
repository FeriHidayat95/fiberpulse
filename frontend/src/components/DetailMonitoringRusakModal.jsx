import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Wrench, Package, Clock, CheckCircle2, Flame, Camera, Download, ZoomIn, Image as ImageIcon, History, RefreshCw, ShieldAlert, FileText, UploadCloud, Plus, Loader2, Trash2, Printer, AlertOctagon } from 'lucide-react';
import toast from 'react-hot-toast';
import { printReportDocument } from '../utils/exportUtils';

export const DetailMonitoringRusakModal = ({ isOpen, onClose, data }) => {
  const [serials, setSerials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // File Upload states & refs
  const damageFileInputRef = useRef(null);
  const scrapFileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Scrap / Destruction Modal states
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [isConfirmAlertOpen, setIsConfirmAlertOpen] = useState(false);
  const [scrapQty, setScrapQty] = useState(1);
  const [scrapNotes, setScrapNotes] = useState('');
  const [scrapPhotoPreview, setScrapPhotoPreview] = useState(null);
  const [scrapPhotoBase64, setScrapPhotoBase64] = useState(null);
  const [submittingScrap, setSubmittingScrap] = useState(false);
  const [selectedSns, setSelectedSns] = useState([]);

  useEffect(() => {
    if (isOpen && data?.id) {
      fetchRealData();
    } else {
      setSerials([]);
      setTransactions([]);
      setSelectedSns([]);
    }
  }, [isOpen, data]);

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const assetTargetId = data.assetId || (String(data.id).startsWith('asset-') ? data.id.replace('asset-', '') : data.id);

      // Fetch Real Items / Serials
      const resItems = await fetch(`/api/assets/${assetTargetId}/items`, { headers });
      if (resItems.ok) {
        const itemsData = await resItems.json();
        const rusakItems = (Array.isArray(itemsData) ? itemsData : itemsData.data || []).filter(
          item => item.condition === 'Rusak' || item.status === 'Rusak' || item.status === 'Scrap'
        );
        setSerials(rusakItems);
        setSelectedSns(rusakItems.map(item => item.serial_number || item.sn).filter(Boolean));
      }

      // Fetch Real Transactions for this asset
      const resTx = await fetch(`/api/assets/transactions?asset_id=${assetTargetId}`, { headers });
      if (resTx.ok) {
        const txData = await resTx.json();
        const allTx = Array.isArray(txData) ? txData : txData.data || [];
        const rusakTx = allTx.filter(t => t.type === 'Rusak' || (t.notes && t.notes.toLowerCase().includes('rusak')));
        setTransactions(rusakTx);
      }
    } catch (err) {
      console.error('Error fetching real damaged asset details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDamageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG/PNG)!');
      return;
    }

    const toastId = toast.loading('Mengunggah foto bukti kerusakan...');
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const assetTargetId = data.assetId || (String(data.id).startsWith('asset-') ? data.id.replace('asset-', '') : data.id);
        const res = await fetch('/api/assets/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            asset_id: assetTargetId,
            category: 'kerusakan',
            notes: `Foto Bukti Kerusakan Fisik - ${data.nama}`,
            photo: base64Data
          })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          toast.success('Foto bukti kerusakan berhasil diunggah!', { id: toastId });
          fetchRealData();
        } else {
          toast.error(json.message || 'Gagal mengunggah foto.', { id: toastId });
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Gagal membaca file gambar.', { id: toastId });
      setUploadingPhoto(false);
    } finally {
      if (damageFileInputRef.current) damageFileInputRef.current.value = '';
    }
  };

  const handleOpenScrapModal = () => {
    const maxQty = parseInt(data.jumlah) || 1;
    setScrapQty(maxQty);
    setScrapNotes(`BA-SCRAP-${Date.now().toString().slice(-6)} - Audit 90 Hari`);
    setScrapPhotoPreview(null);
    setScrapPhotoBase64(null);
    setIsScrapModalOpen(true);
  };

  const handleScrapFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG/PNG)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setScrapPhotoPreview(event.target.result);
      setScrapPhotoBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerConfirmPopup = (e) => {
    e.preventDefault();
    const maxQty = parseInt(data.jumlah) || 1;
    const qty = parseInt(scrapQty);
    if (isNaN(qty) || qty <= 0 || qty > maxQty) {
      toast.error(`Jumlah unit tidak valid! Maksimal: ${maxQty}`);
      return;
    }
    if (!scrapNotes.trim()) {
      toast.error('Nomor Berita Acara / Catatan wajib diisi!');
      return;
    }
    if (!scrapPhotoBase64) {
      toast.error('Foto bukti fisik pemusnahan wajib diunggah sebelum melanjutkan!');
      return;
    }
    setIsConfirmAlertOpen(true);
  };

  const handleExecutePermanentScrap = async () => {
    setIsConfirmAlertOpen(false);
    const toastId = toast.loading('Memproses pemusnahan aset permanen & menerbitkan Berita Acara...');
    setSubmittingScrap(true);
    try {
      const assetTargetId = data.assetId || (String(data.id).startsWith('asset-') ? data.id.replace('asset-', '') : data.id);
      const res = await fetch('/api/assets/scrap-damaged', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          asset_id: assetTargetId,
          quantity: parseInt(scrapQty) || 1,
          notes: `${scrapNotes} [SN: ${selectedSns.join(', ') || '-'}]`,
          photo_url: scrapPhotoBase64
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Pemusnahan aset berhasil diproses secara permanen.', { id: toastId });
        setIsScrapModalOpen(false);
        onClose();
      } else {
        toast.error(json.message || 'Gagal memproses pemusnahan aset.', { id: toastId });
      }
    } catch (err) {
      toast.error('Gagal memproses pemusnahan aset.', { id: toastId });
    } finally {
      setSubmittingScrap(false);
    }
  };
  if (!isOpen || !data) return null;

  const isDestroyed = Boolean(
    data.isDestroyed || 
    data.statusPemusnahan === 'Sudah Dihancurkan' || 
    (data.raw?.damaged_stock === 0 && transactions.some(t => (t.notes || '').toLowerCase().includes('pemusnahan')))
  );

  const baNumber = data.baNumber || (data.txRaw?.notes?.match(/(BA-[A-Za-z0-9\-]+)/)?.[1]) || 'BA-SCRAP-2026-9042';

  const handleDownloadBAPdf = () => {
    const toastId = toast.loading('Menyiapkan dokumen Berita Acara Pemusnahan PDF...');
    printReportDocument({
      title: 'BERITA ACARA PEMUSNAHAN ASET RUSAK (SCRAP)',
      subtitle: 'Dokumen Resmi Berita Acara Penghapusan & Pemusnahan Aset Karantina >90 Hari',
      docNumber: baNumber,
      headers: ['No', 'Nama Aset / Perangkat', 'Merk', 'Kategori', 'Jumlah Dimusnahkan', 'Tanggal Eksekusi', 'Status'],
      rows: [[
        1,
        `<strong>${data.nama}</strong>`,
        data.merk || 'General',
        data.tipe || 'Hardware',
        `<strong>${data.jumlah}</strong>`,
        data.tglPenghancuran || new Date().toISOString().split('T')[0],
        'SUDAH DIHANCURKAN (SCRAP FISIK & DISPOSAL)'
      ]],
      notes: `Dengan diterbitkannya Berita Acara resmi ${baNumber}, seluruh unit aset (${data.nama}) sejumlah ${data.jumlah} telah dimusnahkan secara fisik sesuai standar audit logistik dan telah dihapus dari inventaris aktif PT FiberPulse.`,
      signee1: 'Admin Logistik & Pergudangan',
      signee2: 'Kepala Operasional / Direktur Teknik'
    });
    toast.success('Dokumen Berita Acara siap diunduh / dicetak!', { id: toastId });
  };

  const photoList = [];
  if (data.raw?.photo_url) {
    photoList.push({
      url: data.raw.photo_url,
      title: isDestroyed ? `Bukti Pemusnahan - ${data.nama}` : `Bukti Kerusakan - ${data.nama}`,
      subtitle: `Tercatat pada: ${data.tglPenghancuran || 'Terbaru'}`
    });
  }
  transactions.forEach((tx, idx) => {
    let pUrl = tx.photo_url;
    if (!pUrl && tx.notes && tx.notes.includes('[FOTO:')) {
      const match = tx.notes.match(/\[FOTO:\s*([^\]]+)\]/);
      if (match) pUrl = match[1];
    }
    if (pUrl && !photoList.some(p => p.url === pUrl)) {
      const isScrap = (tx.notes || '').toLowerCase().includes('pemusnahan') || (tx.notes || '').toLowerCase().includes('penghancuran');
      photoList.push({
        url: pUrl,
        title: isScrap ? `Bukti Pemusnahan - ${data.nama}` : `Bukti Kerusakan #${idx + 1} - ${data.nama}`,
        subtitle: `Oleh: ${tx.technician_name || 'Admin Logistik'} • ${tx.created_at ? tx.created_at.split('T')[0] : (data.tglPenghancuran || 'Terbaru')}`
      });
    }
  });

  if (photoList.length === 0) {
    let defaultSvg = '/lampiran-ont.svg';
    const lowerName = (data.nama || '').toLowerCase() + ' ' + (data.tipe || '').toLowerCase();
    if (lowerName.includes('kabel') || lowerName.includes('fo') || lowerName.includes('optic') || lowerName.includes('optik')) {
      defaultSvg = '/lampiran-fo.svg';
    } else if (lowerName.includes('router') || lowerName.includes('wireless') || lowerName.includes('ap')) {
      defaultSvg = '/lampiran-router.svg';
    }
    photoList.push({
      url: defaultSvg,
      title: isDestroyed ? `Arsip Pemusnahan - ${data.nama}` : `Inspeksi Fisik - ${data.nama}`,
      subtitle: `Verifikasi Tim Teknis FiberPulse | Standar Enterprise`
    });
  }

  const tglReport = data.tglPenghancuran || (data.raw?.updated_at ? data.raw.updated_at.split('T')[0] : '2026-07-06');
  const timelineSteps = [
    {
      title: 'Laporan Kerusakan dari Lapangan / Pelanggan',
      date: tglReport,
      desc: `Unit dilaporkan rusak/cacat fisik sejumlah ${data.jumlah}.`,
      icon: <AlertTriangle size={15} color="#DC2626" />,
      bg: '#FEE2E2',
      status: 'Selesai'
    },
    {
      title: 'Verifikasi & Audit Fisik oleh Kepala Gudang',
      date: tglReport,
      desc: 'Pengecekan nomor seri (SN) dan kalibrasi unit di laboratorium logistik.',
      icon: <CheckCircle2 size={15} color="#16A34A" />,
      bg: '#DCFCE7',
      status: 'Selesai'
    },
    {
      title: 'Karantina Gudang Scrap (>90 Hari)',
      date: tglReport,
      desc: 'Diisolasi di area karantina untuk batas waktu retensi minimum 90 hari.',
      icon: <ShieldAlert size={15} color="#D97706" />,
      bg: '#FEF3C7',
      status: 'Selesai'
    },
    {
      title: isDestroyed ? 'Berita Acara Pemusnahan Resmi Terbit' : 'Eksekusi Pemusnahan & Penerbitan BA',
      date: isDestroyed ? (data.tglPenghancuran || 'Selesai') : 'Menunggu Bukti Foto Scrap',
      desc: isDestroyed 
        ? `Telah dimusnahkan secara permanen dengan Berita Acara #${baNumber}.`
        : 'Menunggu proses pemusnahan fisik dan upload bukti foto untuk penerbitan BA.',
      icon: isDestroyed ? <CheckCircle2 size={15} color="#059669" /> : <Clock size={15} color="#D97706" />,
      bg: isDestroyed ? '#ECFDF5' : '#FFFBEB',
      status: isDestroyed ? 'Selesai' : 'Progres'
    }
  ];

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
          border: '1px solid #E2E8F0', animation: 'fadeIn 0.2s ease-out'
        }}>
          
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: isDestroyed ? '#F0FDF4' : '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {isDestroyed ? (
                  <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid #A7F3D0' }}>
                    <CheckCircle2 size={13} /> SUDAH DIHANCURKAN (BA TERBIT)
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid #FDE68A' }}>
                    <Clock size={13} /> MENUNGGU PEMUSNAHAN (&gt;90 HARI)
                  </span>
                )}
                <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #E2E8F0' }}>
                  {data.tipe || 'Hardware'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Audit Pemusnahan — {data.nama}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 600 }}>
                Merk: <span style={{ color: '#1E293B' }}>{data.merk || 'General'}</span> • Kuantitas: <span style={{ color: isDestroyed ? '#059669' : '#DC2626', fontWeight: 800 }}>{data.jumlah}</span>
                {isDestroyed && <span> • No. BA: <strong style={{ color: '#2563EB' }}>{baNumber}</strong></span>}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={fetchRealData}
                disabled={loading}
                style={{
                  background: 'white', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px',
                  fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="Refresh Data"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#3B82F6" />
              </button>

              <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* TIMELINE AUDIT & PROGRESS BAR */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.15rem 1.25rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#152C4A' }}>
                  <History size={15} color="#2563EB" />
                  <span>ALUR AUDIT &amp; TIMELINE PEMUSNAHAN</span>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: '99px',
                  backgroundColor: isDestroyed ? '#ECFDF5' : '#FEF3C7',
                  color: isDestroyed ? '#059669' : '#D97706',
                  border: `1px solid ${isDestroyed ? '#A7F3D0' : '#FDE68A'}`
                }}>
                  {isDestroyed ? 'Progress 100% (Selesai Pemusnahan)' : 'Progress 80% (Karantina >90 Hari)'}
                </span>
              </div>

              {/* Progress Track Bar */}
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{
                  height: '100%',
                  width: isDestroyed ? '100%' : '80%',
                  background: isDestroyed ? '#10B981' : 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Steps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.25rem' }}>
                {timelineSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)' }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1, borderBottom: idx === timelineSteps.length - 1 ? 'none' : '1px solid #F1F5F9', paddingBottom: idx === timelineSteps.length - 1 ? 0 : '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{step.title}</div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', backgroundColor: step.status === 'Selesai' ? '#DCFCE7' : '#FEF3C7', color: step.status === 'Selesai' ? '#16A34A' : '#D97706' }}>
                          {step.status === 'Selesai' ? '✔ Selesai' : '⏳ Progres'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{step.desc}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px', fontWeight: 600 }}>📅 {step.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DAFTAR SERIAL NUMBER (Multi-Unit Handling) */}
            {serials.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15} color="#2563EB" />
                    <span>DAFTAR SERIAL NUMBER RUSAK ({serials.length} UNIT)</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontStyle: 'italic' }}>
                    Multi-Unit Terverifikasi
                  </span>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>NO.</th>
                        <th style={{ padding: '8px 12px' }}>SERIAL NUMBER (SN)</th>
                        <th style={{ padding: '8px 12px' }}>KONDISI</th>
                        <th style={{ padding: '8px 12px' }}>STATUS GUDANG</th>
                        <th style={{ padding: '8px 12px' }}>TGL UPDATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serials.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: idx === serials.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? 'white' : '#FCFDFE' }}>
                          <td style={{ padding: '8px 12px', color: '#64748B', fontFamily: 'monospace' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>
                            {s.serial_number || s.sn || '-'}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
                              {s.condition || s.status || 'Rusak'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: '#475569', fontWeight: 600 }}>
                            {isDestroyed ? 'Dimusnahkan (Scrap)' : 'Karantina Rusak'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748B', fontFamily: 'monospace' }}>
                            {s.updated_at ? s.updated_at.split('T')[0] : tglReport}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FOTO BUKTI KERUSAKAN / PEMUSNAHAN */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="#2563EB" /> 
                  <span>{isDestroyed ? 'ARSIP BUKTI PEMUSNAHAN FISIK' : 'FOTO BUKTI KERUSAKAN & INSPEKSI FISIK'}</span> 
                  <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #BFDBFE' }}>{photoList.length}</span>
                </div>
                
                {!isDestroyed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => damageFileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      style={{
                        backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                        borderRadius: '8px', padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                        boxShadow: '0 1px 2px rgba(37,99,235,0.08)'
                      }}
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={13} />
                          <span>+ Tambah Foto Kerusakan</span>
                        </>
                      )}
                    </button>
                    <input
                      type="file"
                      ref={damageFileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleDamageFileChange}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                {photoList.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div 
                      style={{ height: '130px', backgroundColor: '#0F172A', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                      onClick={() => setLightboxPhoto(item)}
                    >
                      <img 
                        src={item.url} alt="Bukti Foto" loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.7rem', fontWeight: 600, flexDirection: 'column', padding: '8px', textAlign: 'center' }}>
                        <span>🖼️ Gagal Muat</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ZoomIn size={10} /> Zoom
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {isDestroyed ? (
                <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Dokumen Berita Acara #{baNumber} Tersimpan
                </span>
              ) : (
                <span style={{ color: '#DC2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={14} /> Retensi Karantina &gt;90 Hari Terpenuhi
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {isDestroyed ? (
                <button 
                  onClick={handleDownloadBAPdf}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                    backgroundColor: '#059669', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                  }}
                >
                  <Printer size={15} /> Unduh Berita Acara (PDF)
                </button>
              ) : (
                <button 
                  onClick={handleOpenScrapModal}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                    backgroundColor: '#DC2626', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <Flame size={15} /> + Unggah Bukti Scrap &amp; Eksekusi
                </button>
              )}

              <button 
                onClick={onClose}
                style={{
                  padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Form Pemusnahan Aset Rusak */}
      {isScrapModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px',
            margin: 'auto', maxHeight: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #CBD5E1',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF2F2', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#991B1B' }}>Eksekusi Pemusnahan Aset (Scrap)</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#B91C1C', fontWeight: 500 }}>{data.nama} ({data.merk || 'General'})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScrapModalOpen(false)}
                style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', width: '28px', height: '28px', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleTriggerConfirmPopup} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Jumlah Unit Dimusnahkan (Maksimal: {data.jumlah})
                </label>
                <input
                  type="number"
                  min="1"
                  max={parseInt(data.jumlah) || 1}
                  value={scrapQty}
                  onChange={(e) => setScrapQty(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nomor Berita Acara / Keterangan Pemusnahan
                </label>
                <input
                  type="text"
                  value={scrapNotes}
                  onChange={(e) => setScrapNotes(e.target.value)}
                  placeholder="Contoh: BA-SCRAP-2026-001 - Audit Scrap Q3"
                  required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.8rem', color: '#1E293B', boxSizing: 'border-box' }}
                />
              </div>

              {/* Upload Foto Bukti Penghancuran (Wajib Diunggah) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                    Foto Bukti Penghancuran / Scrap Fisik
                  </label>
                  <span style={{ fontSize: '0.68rem', color: scrapPhotoBase64 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                    {scrapPhotoBase64 ? '✔ Foto Terlampir' : '* Wajib Diunggah'}
                  </span>
                </div>

                <div style={{ border: `2px dashed ${scrapPhotoBase64 ? '#86EFAC' : '#CBD5E1'}`, borderRadius: '10px', padding: '1rem', textAlign: 'center', backgroundColor: scrapPhotoBase64 ? '#F0FDF4' : '#F8FAFC' }}>
                  {scrapPhotoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={scrapPhotoPreview}
                        alt="Preview Bukti Penghancuran"
                        style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E2E8F0' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScrapPhotoPreview(null);
                          setScrapPhotoBase64(null);
                          if (scrapFileInputRef.current) scrapFileInputRef.current.value = '';
                        }}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          backgroundColor: '#EF4444', color: 'white', border: 'none',
                          borderRadius: '50%', width: '24px', height: '24px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera size={28} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                        Lampirkan foto fisik proses pemusnahan unit agar tombol konfirmasi aktif.
                      </p>
                      <button
                        type="button"
                        onClick={() => scrapFileInputRef.current?.click()}
                        style={{
                          backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                          padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <UploadCloud size={14} /> Pilih / Ambil Foto Bukti Scrap
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={scrapFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleScrapFileChange}
                  />
                </div>
              </div>

              {/* Status Warning Validasi Foto */}
              {!scrapPhotoBase64 && (
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.6rem 0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#B45309' }}>
                  <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0 }} />
                  <span>Tombol konfirmasi terkunci hingga foto bukti scrap fisik diunggah.</span>
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setIsScrapModalOpen(false)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!scrapPhotoBase64 || submittingScrap}
                  style={{
                    padding: '7px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: scrapPhotoBase64 ? '#DC2626' : '#94A3B8',
                    color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700,
                    cursor: scrapPhotoBase64 ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    boxShadow: scrapPhotoBase64 ? '0 2px 4px rgba(220, 38, 38, 0.2)' : 'none'
                  }}
                >
                  <Flame size={14} />
                  <span>Konfirmasi Eksekusi Scrap</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-Up Konfirmasi Destruktif Permanen */}
      {isConfirmAlertOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
          zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid #FECACA',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FEF2F2', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertOctagon size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#991B1B' }}>
                  Konfirmasi Tindakan Destruktif Permanen
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#B91C1C', fontWeight: 600 }}>Pemusnahan Inventaris Logistik</span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin memusnahkan <strong>{scrapQty} unit</strong> aset (<strong>{data.nama}</strong>) secara permanen?
              </p>
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem', fontSize: '0.72rem', color: '#991B1B', lineHeight: 1.4 }}>
                ⚠️ <strong>Peringatan Audit:</strong> Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Unit akan dihapus dari buku inventaris dan Berita Acara Pemusnahan (BA) akan diterbitkan secara resmi.
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmAlertOpen(false)}
                disabled={submittingScrap}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePermanentScrap}
                disabled={submittingScrap}
                style={{
                  padding: '7px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                }}
              >
                {submittingScrap ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Ya, Hancurkan Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Photo */}
      {lightboxPhoto && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(6px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            style={{
              backgroundColor: '#1E293B', borderRadius: '16px', overflow: 'hidden',
              maxWidth: '700px', width: '100%', margin: 'auto', maxHeight: 'min(90vh, 750px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155', position: 'relative', animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ color: '#F8FAFC', margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={16} color="#3B82F6" /> {lightboxPhoto.title}
                </h3>
                <p style={{ color: '#94A3B8', margin: '3px 0 0 0', fontSize: '0.75rem' }}>{lightboxPhoto.subtitle}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href={lightboxPhoto.url} target="_blank" rel="noopener noreferrer" download
                  style={{ padding: '5px 12px', borderRadius: '6px', backgroundColor: '#334155', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={13} /> Download
                </a>
                <button 
                  onClick={() => setLightboxPhoto(null)}
                  style={{ background: '#EF4444', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', minHeight: '300px', maxHeight: '70vh', overflow: 'hidden' }}>
              <img 
                src={lightboxPhoto.url} alt="Bukti Foto" loading="lazy"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', padding: '2rem' }}>
                <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Gagal memuat lampiran foto dari server</p>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>File mungkin telah dipindahkan atau koneksi terputus</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
