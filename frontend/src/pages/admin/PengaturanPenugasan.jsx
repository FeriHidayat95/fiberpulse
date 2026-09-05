import React, { useState, useEffect } from 'react';
import { 
  Sliders, Cpu, UserCheck, ShieldCheck, CheckCircle2, 
  Save, RefreshCw, Zap, Bell, Check, MapPin, Users, Activity, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const PengaturanPenugasan = () => {
  const [dispatchMode, setDispatchMode] = useState('manual'); // 'manual' | 'auto'
  const [autoStrategy, setAutoStrategy] = useState('workload'); // 'workload' | 'proximity' | 'round_robin'
  const [maxTasksPerTech, setMaxTasksPerTech] = useState(5);
  const [autoAssignPasangBaru, setAutoAssignPasangBaru] = useState(true);
  const [autoAssignPerbaikan, setAutoAssignPerbaikan] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [saving, setSaving] = useState(false);

  useDocumentTitle('Pengaturan Penugasan — FiberPulse');

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('dispatch_settings');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.dispatchMode) setDispatchMode(parsed.dispatchMode);
        if (parsed.autoStrategy) setAutoStrategy(parsed.autoStrategy);
        if (parsed.maxTasksPerTech) setMaxTasksPerTech(parsed.maxTasksPerTech);
        if (parsed.autoAssignPasangBaru !== undefined) setAutoAssignPasangBaru(parsed.autoAssignPasangBaru);
        if (parsed.autoAssignPerbaikan !== undefined) setAutoAssignPerbaikan(parsed.autoAssignPerbaikan);
        if (parsed.notifyWhatsApp !== undefined) setNotifyWhatsApp(parsed.notifyWhatsApp);
      }
    } catch (e) {
      console.error("Error loading dispatch settings:", e);
    }
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    const config = {
      dispatchMode,
      autoStrategy,
      maxTasksPerTech: Number(maxTasksPerTech),
      autoAssignPasangBaru,
      autoAssignPerbaikan,
      notifyWhatsApp,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('dispatch_settings', JSON.stringify(config));
      
      await fetch('/api/api-keys/advanced-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatch_config: JSON.stringify(config) })
      }).catch(() => {});

      toast.success("Pengaturan Penugasan Teknisi berhasil disimpan!");
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunAutoDispatch = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/orders/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: autoStrategy,
          max_tasks_per_tech: Number(maxTasksPerTech)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Auto-dispatch sukses! ${data.assigned_count} order ditugaskan.`);
      } else {
        toast.error(data.message || "Gagal memproses auto-dispatch.");
      }
    } catch (e) {
      toast.error("Gagal terhubung ke server auto-dispatch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Hero Operations Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
            Pengaturan Penugasan Teknisi
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Konfigurasi alur penugasan otomatis & manual, strategi algoritma dispatch, dan notifikasi teknisi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Eksekusi Auto-Dispatch Button */}
          <button
            onClick={handleRunAutoDispatch}
            disabled={saving}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #10B981',
              color: '#059669',
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={14} color="#10B981" />
            <span>Eksekusi Auto-Dispatch</span>
          </button>

          {/* Primary Save Button (FiberPulse Gradient) */}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="sgt-btn-primary"
            style={{
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Main Grid: Form Controls & Summary Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Left Column: Form Controls (2 Cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Card 1: Mode Alokasi Penugasan */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>Mode Alokasi Penugasan</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Pilih metode penugasan order ke teknisi lapangan</p>
                </div>
              </div>

              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                backgroundColor: dispatchMode === 'auto' ? '#ECFDF5' : '#F1F7FC',
                color: dispatchMode === 'auto' ? '#059669' : '#2563EB',
                border: `1px solid ${dispatchMode === 'auto' ? '#A7F3D0' : '#DBEAFE'}`
              }}>
                {dispatchMode === 'auto' ? 'Otomatis Aktif' : 'Manual Dispatch'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Manual */}
              <div
                onClick={() => setDispatchMode('manual')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: dispatchMode === 'manual' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: dispatchMode === 'manual' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#152C4A', fontSize: '0.85rem' }}>
                    <UserCheck size={16} color={dispatchMode === 'manual' ? '#2563EB' : '#64748B'} />
                    Manual Dispatch
                  </div>
                  {dispatchMode === 'manual' && <CheckCircle2 size={16} color="#2563EB" />}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  Admin/Dispatcher memilih dan menugaskan tiket order secara manual ke teknisi.
                </p>
              </div>

              {/* Option 2: Otomatis */}
              <div
                onClick={() => setDispatchMode('auto')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: dispatchMode === 'auto' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: dispatchMode === 'auto' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#152C4A', fontSize: '0.85rem' }}>
                    <Cpu size={16} color={dispatchMode === 'auto' ? '#2563EB' : '#64748B'} />
                    Auto Dispatch (Otomatis)
                  </div>
                  {dispatchMode === 'auto' && <CheckCircle2 size={16} color="#2563EB" />}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  Sistem otomatis mengalokasikan order baru ke teknisi berdasarkan algoritma & beban kerja.
                </p>
              </div>

            </div>
          </div>

          {/* Card 2: Strategi Algoritma Auto-Dispatch (Conditional) */}
          {dispatchMode === 'auto' && (
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>Strategi Algoritma Auto-Dispatch</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Pilih aturan pembagian tugas otomatis ke teknisi</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Strategy 1: Lowest Workload */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.75rem 1rem', borderRadius: '8px',
                  border: autoStrategy === 'workload' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: autoStrategy === 'workload' ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="autoStrategy"
                    value="workload"
                    checked={autoStrategy === 'workload'}
                    onChange={() => setAutoStrategy('workload')}
                    style={{ marginTop: '3px', accentColor: '#2563EB' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#152C4A', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} color="#2563EB" />
                      Beban Terendah (Lowest Active Workload) — Direkomendasikan
                    </div>
                    <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '2px 0 0 0' }}>
                      Mengalokasikan tiket ke teknisi yang sedang menangani jumlah tugas aktif paling sedikit.
                    </p>
                  </div>
                </label>

                {/* Strategy 2: Proximity GIS */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.75rem 1rem', borderRadius: '8px',
                  border: autoStrategy === 'proximity' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: autoStrategy === 'proximity' ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="autoStrategy"
                    value="proximity"
                    checked={autoStrategy === 'proximity'}
                    onChange={() => setAutoStrategy('proximity')}
                    style={{ marginTop: '3px', accentColor: '#2563EB' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#152C4A', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#10B981" />
                      Lokasi ODP Terdekat (GIS Proximity)
                    </div>
                    <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '2px 0 0 0' }}>
                      Prioritas penugasan berdasarkan jarak teknisi yang paling dekat dengan titik ODP pelanggan.
                    </p>
                  </div>
                </label>

                {/* Strategy 3: Round Robin */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.75rem 1rem', borderRadius: '8px',
                  border: autoStrategy === 'round_robin' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: autoStrategy === 'round_robin' ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="autoStrategy"
                    value="round_robin"
                    checked={autoStrategy === 'round_robin'}
                    onChange={() => setAutoStrategy('round_robin')}
                    style={{ marginTop: '3px', accentColor: '#2563EB' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#152C4A', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#8B5CF6" />
                      Round Robin (Pemerataan Giliran)
                    </div>
                    <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '2px 0 0 0' }}>
                      Penugasan bergiliran secara merata ke setiap teknisi aktif.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Card 3: Batas & Parameter Tugas */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>Parameter & Batas Tugas</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Atur batasan kapasitas dan kategori penugasan teknisi</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              
              {/* Max Tasks per Tech Slider */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                  Batas Maksimum Tugas Aktif per Teknisi
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={maxTasksPerTech}
                    onChange={(e) => setMaxTasksPerTech(e.target.value)}
                    style={{ flex: 1, accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB', padding: '3px 10px', borderRadius: '6px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', fontFamily: 'monospace' }}>
                    {maxTasksPerTech} Tugas
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Jika teknisi mencapai batas ini, sistem tidak akan mengalokasikan tugas baru ke teknisi tersebut.
                </p>
              </div>

              <div style={{ height: '1px', backgroundColor: '#F1F5F9' }} />

              {/* Checkboxes for Categories */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#152C4A' }}>Auto-Assign Pasang Baru (PSB)</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Otomasikan penugasan saat ada order pasang baru masuk</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAssignPasangBaru}
                    onChange={(e) => setAutoAssignPasangBaru(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#152C4A' }}>Auto-Assign Perbaikan Gangguan</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Otomasikan penugasan tiket pemeliharaan & gangguan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAssignPerbaikan}
                    onChange={(e) => setAutoAssignPerbaikan(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#152C4A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={13} color="#059669" />
                      Kirim Notifikasi WhatsApp ke Teknisi
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Notifikasi otomatis via WA saat tiket ditugaskan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsApp}
                    onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                </label>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Status & Panduan (1 Col) */}
        <div className="flex flex-col gap-3">
          
          {/* Status Konfigurasi Aktif */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#152C4A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status Konfigurasi
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Mode Penugasan:</span>
                <span style={{ fontWeight: 700, color: dispatchMode === 'auto' ? '#059669' : '#2563EB' }}>
                  {dispatchMode === 'auto' ? 'Otomatis' : 'Manual'}
                </span>
              </div>

              {dispatchMode === 'auto' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Strategi:</span>
                  <span style={{ fontWeight: 700, color: '#152C4A' }}>
                    {autoStrategy === 'workload' ? 'Beban Terendah' : autoStrategy === 'proximity' ? 'GIS Proximity' : 'Round Robin'}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Max Task / Teknisi:</span>
                <span style={{ fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>{maxTasksPerTech} Tiket</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Notifikasi WA:</span>
                <span style={{ fontWeight: 700, color: notifyWhatsApp ? '#059669' : '#DC2626' }}>
                  {notifyWhatsApp ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Panduan Mode Penugasan Callout */}
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#F1F7FC', border: '1px solid #E2EBF4', color: '#152C4A' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Info size={14} color="#2563EB" /> Panduan Mode Penugasan
            </div>
            <p style={{ fontSize: '0.7rem', margin: 0, lineHeight: 1.4, color: '#475569' }}>
              Pada <strong>Mode Otomatis</strong>, ketika pelanggan mendaftar order baru via form atau WhatsApp, sistem akan langsung menunjuk teknisi terluang tanpa perlu intervensi admin manual.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
