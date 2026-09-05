import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle2, ShieldCheck, Wrench, Package, MapPin, 
  ArrowRight, AlertTriangle, Smartphone, Monitor, QrCode, 
  RotateCcw, Sparkles, Copy, Check, ExternalLink, Printer, 
  ChevronRight, Layers, FileText, Send, UserCheck, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const DokumentasiAlur = () => {
  useDocumentTitle('Panduan Alur Operasional & Testing — FiberPulse');
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Tersalin: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header Navbar */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 50, 
        backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
        padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo-sgt.png" alt="FiberPulse" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ height: '24px', width: '1px', backgroundColor: '#CBD5E1' }}></div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
              Dokumentasi Alur Sistem & Panduan Testing
            </h1>
            <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Standar Operasional BAB IV (Politeknik Negeri Subang) × Modern UI
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a 
            href="/admin/login" 
            style={{ 
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#EFF6FF',
              color: '#2563EB', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #BFDBFE'
            }}
          >
            <Monitor size={14} /> Ke Panel Admin
          </a>
          <a 
            href="/teknisi/login" 
            style={{ 
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#152C4A',
              color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700
            }}
          >
            <Smartphone size={14} /> Ke Web Teknisi
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #152C4A 0%, #1E3A8A 50%, #2563EB 100%)', 
        color: '#FFFFFF', padding: '2.5rem 1.5rem', textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} color="#FDE047" /> Standar Pengujian Terpadu Tim QA & Testing
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Alur Bisnis & Validasi Sistem Sasikirana Net
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#E2E8F0', maxWidth: '700px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Panduan ringkas, padat, dan jelas untuk memandu pengujian menyeluruh pada modul Admin, Inventaris Gudang, GIS Pemetaan ODP, dan Aplikasi Mobile Teknisi.
          </p>

          {/* Quick Credential Badges */}
          <div style={{ 
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', 
            backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '0.85rem 1.25rem', borderRadius: '12px', maxWidth: '750px', margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: '#93C5FD', fontWeight: 600 }}>Login Admin:</span>
              <code style={{ background: '#1E293B', padding: '2px 6px', borderRadius: '4px', color: '#FDE047' }}>admin / admin123</code>
              <button 
                onClick={() => handleCopy('admin', 'admin_u')} 
                style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Salin Username Admin"
              >
                {copiedKey === 'admin_u' ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              </button>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: '#93C5FD', fontWeight: 600 }}>Login Teknisi:</span>
              <code style={{ background: '#1E293B', padding: '2px 6px', borderRadius: '4px', color: '#FDE047' }}>teknisi / teknisi123</code>
              <button 
                onClick={() => handleCopy('teknisi', 'tech_u')} 
                style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Salin Username Teknisi"
              >
                {copiedKey === 'tech_u' ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', 
          borderBottom: '1px solid #E2E8F0', marginBottom: '1.75rem' 
        }}>
          {[
            { id: 'overview', label: '1. Ringkasan Alur Sistem', icon: Activity },
            { id: 'teknisi', label: '2. Alur 4 Tugas Teknisi', icon: Smartphone },
            { id: 'sn_odp', label: '3. Validasi Serial Number (SN)', icon: QrCode },
            { id: 'admin', label: '4. Alur & Proteksi Admin', icon: ShieldCheck },
            { id: 'gudang', label: '5. Logistik & Audit Rusak', icon: Package },
            { id: 'checklist', label: '6. Checklist Tim Testing', icon: CheckCircle2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  backgroundColor: isActive ? '#152C4A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  boxShadow: isActive ? '0 2px 6px rgba(21,44,74,0.2)' : 'none',
                  border: isActive ? '1px solid #152C4A' : '1px solid #E2E8F0'
                }}
              >
                <Icon size={14} color={isActive ? '#60A5FA' : '#94A3B8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#2563EB" /> Gambaran Umum Siklus Operasional
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                Sistem ini menghubungkan <strong>Order Pelanggan (WhatsApp/Admin)</strong> ➔ <strong>Penugasan Teknisi Lapangan</strong> ➔ <strong>Pemetaan GIS Titik ODP</strong> ➔ <strong>Mutasi Stok Gudang Otomatis</strong> dengan integritas data ketat sesuai dokumen BAB IV Politeknik Negeri Subang.
              </p>

              {/* 4 Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>1</div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A' }}>Order & Permintaan</h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#3B82F6', margin: 0, lineHeight: 1.4 }}>
                    Admin mencatat order baru atau order masuk otomatis dari WhatsApp AI Bot Gateway.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>2</div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#5B21B6' }}>Penugasan Teknisi</h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#7C3AED', margin: 0, lineHeight: 1.4 }}>
                    Admin mendelegasikan tugas (Pasang Baru, Pembangunan, Gangguan, Pencabutan) ke teknisi.
                  </p>
                </div>

                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>3</div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#065F46' }}>Eksekusi HP Teknisi</h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#059669', margin: 0, lineHeight: 1.4 }}>
                    Teknisi scan Serial Number (SN) modem, foto bukti lapangan, ukur redaman dBm, dan selesai.
                  </p>
                </div>

                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#D97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>4</div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#92400E' }}>Otomasi Stok & Port</h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#D97706', margin: 0, lineHeight: 1.4 }}>
                    Stok gudang terpotong real-time, port ODP terkunci, dan data pelanggan langsung aktif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 4 TUGAS TEKNISI */}
        {activeTab === 'teknisi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Pasang Baru */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  ALUR 1: PASANG BARU (PSB)
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Use Case 37 & 39 BAB IV</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>STEP 1: AMBIL ASET</div>
                  <p style={{ fontSize: '0.75rem', margin: 0, color: '#475569' }}>
                    Ambil modem dari gudang ➔ <strong>Scan Barcode / Input SN Modem</strong> ➔ Upload foto bukti ambil barang.
                  </p>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>STEP 2: DOKUMENTASI</div>
                  <p style={{ fontSize: '0.75rem', margin: 0, color: '#475569' }}>
                    Upload foto perangkat menyala (PON Hijau), foto rumah pelanggan, kabel FO terpasang, & input nilai redaman (dBm).
                  </p>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981', marginBottom: '4px' }}>STEP 3: SELESAI</div>
                  <p style={{ fontSize: '0.75rem', margin: 0, color: '#475569' }}>
                    Klik <strong>Selesaikan Penugasan</strong> ➔ Stok modem gudang otomatis terpotong 1 unit & port ODP terkunci.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Pembangunan ODP */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  ALUR 2: PEMBANGUNAN JARINGAN & TIANG ODP
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Use Case 34 BAB IV</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.75rem 0' }}>
                Setelah teknisi selesai memasang tiang/box ODP baru, sistem <strong>secara otomatis mengarahkan ke form Tambah Titik ODP Baru di Peta GIS</strong>.
              </p>
              <div style={{ backgroundColor: '#F5F3FF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DDD6FE', fontSize: '0.75rem', color: '#5B21B6' }}>
                <strong>Wajib Input:</strong> Nama ODP (e.g. <code>ODP-SLG-03</code>), Kode/SN ODP (e.g. <code>SN-ODP-SLG-003</code>), Jumlah Port (8 atau 16), Titik GPS Kamera/HP, dan Dusun.
              </div>
            </div>

            {/* 3. Pemeliharaan / Gangguan */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  ALUR 3: PEMELIHARAAN / PERBAIKAN GANGGUAN
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Activity Diagram 40 BAB IV</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#ECFDF5', padding: '0.75rem', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.75rem', color: '#065F46' }}>
                  <strong>Kondisi A (Normal):</strong> Masalah selesai tanpa ganti alat ➔ Upload foto Before & After ➔ Selesaikan Tugas normal.
                </div>
                <div style={{ backgroundColor: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '0.75rem', color: '#92400E' }}>
                  <strong>Kondisi B (Butuh Ganti Sparepart):</strong> Centang <em>"Membutuhkan Pergantian Barang?"</em> ➔ Masukkan nama suku cadang ➔ Tombol berubah jadi <strong>"Kirim Eskalasi ke Admin"</strong> ➔ Status berubah ke <code>Menunggu</code>.
                </div>
              </div>
            </div>

            {/* 4. Pencabutan Alat */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  ALUR 4: PENCABUTAN ALAT & RETURN TO STOCK (RTS)
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Use Case 38 BAB IV</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.5rem 0' }}>
                Teknisi mendatangi pelanggan nonaktif ➔ Tarik Modem & Adaptor ➔ Masukkan <strong>Serial Number (SN)</strong> dan kondisi (Baik / Rusak).
              </p>
              <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '0.75rem', color: '#991B1B' }}>
                <strong>Dampak Sistem:</strong> Status pelanggan menjadi <code>Non-Aktif</code>, Port ODP kembali bebas, dan unit masuk ke master gudang sebagai <strong>Stok Cabutan (RTS)</strong> yang siap dipakai kembali.
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: VALIDASI SERIAL NUMBER */}
        {activeTab === 'sn_odp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="#2563EB" /> Aturan Wajib Serial Number (SN)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Sistem menerapkan validasi ketat pada perangkat keras vital agar aset terdata akurat tanpa ada unit yang hilang atau tertukar.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #2563EB', borderRadius: '10px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#152C4A' }}>Modem ONT & Router</h4>
                      <span style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700 }}>Wajib Serial Number (SN)</span>
                    </div>
                  </div>
                  <ul style={{ fontSize: '0.75rem', color: '#475569', margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    <li><strong>Saat Pasang Baru:</strong> Teknisi WAJIB scan kamera barcode atau input SN (contoh: <code>ZTE-F670L-SN-998811</code>). Jika kosong, sistem menolak tombol selesai.</li>
                    <li><strong>Saat Pencabutan:</strong> SN unit dicatat kembali sebagai <strong>Stok Cabutan (RTS)</strong>.</li>
                    <li><strong>Di Gudang:</strong> Admin bisa melihat status tiap unit SN: <em>Gudang, Terpasang di Pelanggan, atau Rusak</em>.</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #10B981', borderRadius: '10px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#152C4A' }}>Tiang & Box ODP GIS</h4>
                      <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>Wajib Kode / Barcode ODP</span>
                    </div>
                  </div>
                  <ul style={{ fontSize: '0.75rem', color: '#475569', margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    <li><strong>Nama Tiang Standar:</strong> Sesuai format BAB IV: <code>Nama Desa - Nomor Tiang</code> (contoh: <code>ODP-SLG-01</code>).</li>
                    <li><strong>Kode Barcode / SN:</strong> Setiap box memiliki kode QR (contoh: <code>SN-ODP-SLG-001</code>).</li>
                    <li><strong>Proteksi Port:</strong> Sistem otomatis menolak jika 2 pelanggan mencoba memakai nomor port yang sama di 1 ODP.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ALUR & PROTEKSI ADMIN */}
        {activeTab === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#2563EB" /> Aturan Integritas Data Admin Panel
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Sesuai aturan keamanan data BAB IV (Use Case 24, 26, 29, 31), seluruh data yang sedang aktif atau sudah selesai dikunci dari modifikasi sembarangan.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 800, color: '#92400E' }}>
                    1. Proteksi Order Pelanggan
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#B45309', margin: 0, lineHeight: 1.5 }}>
                    Tombol <strong>Edit</strong> dan <strong>Hapus</strong> order HANYA aktif saat order berstatus <code>Pending / Menunggu</code>. Order yang sudah diproses atau selesai terkunci permanen demi rekam audit.
                  </p>
                </div>

                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A' }}>
                    2. Proteksi Penugasan Teknisi
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#2563EB', margin: 0, lineHeight: 1.5 }}>
                    Tugas teknisi yang sedang <code>Dikerjakan</code> atau sudah <code>Selesai</code> tidak dapat dibatalkan atau dihapus sembarangan. Pembatalan hanya diizinkan saat status masih <code>Menunggu</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOGISTIK & AUDIT RUSAK */}
        {activeTab === 'gudang' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#2563EB" /> Alur Logistik & Pemusnahan Aset Rusak (Berita Acara)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Gudang Sasikirana Net mengklasifikasikan aset menjadi <strong>Stok Baru (Pengadaan)</strong>, <strong>Stok Cabutan (RTS)</strong>, dan <strong>Stok Rusak (BRS)</strong>.
              </p>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} /> Audit Pemusnahan Barang Rusak &gt; 90 Hari (BAB IV Activity Diagram 17)
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                  Barang rusak yang menumpuk lebih dari 90 hari dimusnahkan secara berkala per triwulan (3 bulan sekali).
                </p>
                <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.75rem', color: '#991B1B' }}>
                  <strong>Langkah Pengujian Admin:</strong> Buka menu <em>Monitoring Rusak</em> ➔ Klik tombol <em>Detail</em> ➔ Tekan tombol merah <strong>"Pemusnahan Aset Rusak (Berita Acara)"</strong> ➔ Masukkan jumlah unit & nomor Berita Acara (e.g. <code>BA-SCRAP-2026-08</code>) ➔ Stok rusak terpotong bersih dengan rekam jejak audit.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CHECKLIST TESTING */}
        {activeTab === 'checklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10B981" /> Skenario Checklist untuk Tim Testing
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
                Ikuti 5 langkah pengujian berikut untuk memverifikasi fungsionalitas sistem secara menyeluruh:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
                    step: 'Test Case 1',
                    title: 'Uji Pasang Baru & Validasi Modem SN',
                    action: 'Buat order di Admin ➔ Tugaskan ke Teknisi ➔ Buka Web Teknisi ➔ Coba selesaikan tanpa SN (harus ditolak) ➔ Masukkan SN Modem (e.g. ZTE-SN-01) ➔ Selesai.',
                    expected: 'Customer berstatus Aktif, Port ODP terisi 1, Stok modem gudang berkurang 1 unit.'
                  },
                  {
                    step: 'Test Case 2',
                    title: 'Uji Pembangunan ODP Baru di GIS',
                    action: 'Admin buat tugas Pembangunan ➔ Teknisi selesaikan ➔ Form Tambah ODP Baru terbuka otomatis ➔ Masukkan SN ODP (e.g. SN-ODP-04) & koordinat GPS ➔ Simpan.',
                    expected: 'Titik ODP baru muncul di peta GIS dengan kapasitas port siap pakai.'
                  },
                  {
                    step: 'Test Case 3',
                    title: 'Uji Pemeliharaan Gangguan & Eskalasi Suku Cadang',
                    action: 'Admin buat tugas Perbaikan Gangguan ➔ Teknisi buka tugas ➔ Centang "Membutuhkan Pergantian Barang" ➔ Ketik kebutuhan sparepart ➔ Kirim Eskalasi.',
                    expected: 'Status tugas beralih ke "Menunggu" (Eskalasi Admin) dan muncul notifikasi di admin.'
                  },
                  {
                    step: 'Test Case 4',
                    title: 'Uji Pencabutan & Return to Stock (RTS)',
                    action: 'Admin buat tugas Pencabutan ➔ Teknisi input SN Modem yang ditarik ➔ Selesaikan tugas.',
                    expected: 'Status pelanggan jadi Non-Aktif, port ODP bebas, dan Stok Cabutan di gudang bertambah.'
                  },
                  {
                    step: 'Test Case 5',
                    title: 'Uji Proteksi Integritas Admin',
                    action: 'Coba tekan tombol Edit atau Hapus pada Order/Tugas yang sedang berstatus "Proses" atau "Selesai".',
                    expected: 'Sistem menampilkan toast peringatan dan menolak aksi edit/hapus sesuai aturan BAB IV.'
                  }
                ].map((tc, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                        {tc.step}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A' }}>{tc.title}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#475569', margin: '4px 0', lineHeight: 1.4 }}>
                      <strong>Langkah:</strong> {tc.action}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#059669', margin: 0, fontWeight: 600 }}>
                      ✔ <strong>Hasil yang Diharapkan:</strong> {tc.expected}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', 
        padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' 
      }}>
        <p style={{ margin: 0, fontWeight: 500 }}>
          © 2026 FiberPulse Technologies Inc. — Sistem Informasi Inventaris Aset & Manajemen Tugas Teknisi.
        </p>
      </footer>

    </div>
  );
};
