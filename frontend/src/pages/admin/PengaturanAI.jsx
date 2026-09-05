import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { 
  Bot, Key, Plus, Trash2, RotateCcw, AlertTriangle, ShieldCheck, 
  Smartphone, LogOut, RefreshCw, CheckCircle2, Save, Server, 
  ChevronDown, ChevronUp, Power, Check, Info, QrCode, Copy, KeyRound, Users 
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AiKnowledgeBasePanel } from '../../components/admin/AiKnowledgeBasePanel';
import { MediaLibraryPanel } from '../../components/admin/MediaLibraryPanel';
import { AISandboxPanel } from '../../components/admin/AISandboxPanel';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const PengaturanAI = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [globalStatus, setGlobalStatus] = useState(true);

  // WA Evolution States
  const [waStatus, setWaStatus] = useState('loading');
  const [qrCode, setQrCode] = useState(null);
  const [instanceName, setInstanceName] = useState('CS_BOT');
  const [isSavingInstance, setIsSavingInstance] = useState(false);
  const [pairingMode, setPairingMode] = useState('qr'); // 'qr' | 'phone'
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [isRequestingPairingCode, setIsRequestingPairingCode] = useState(false);
  const [hasCopiedPairingCode, setHasCopiedPairingCode] = useState(false);

  // Evo Config States
  const [evoUrl, setEvoUrl] = useState('');
  const [evoKey, setEvoKey] = useState('');
  const [isSavingEvoConfig, setIsSavingEvoConfig] = useState(false);
  const [ignoredNumbers, setIgnoredNumbers] = useState('');
  const [savingIgnored, setSavingIgnored] = useState(false);

  // Handover States
  const [handoverDuration, setHandoverDuration] = useState('120');
  const [isSavingHandover, setIsSavingHandover] = useState(false);

  // Triage States
  const [triageDbIntegration, setTriageDbIntegration] = useState(true);
  const [triageGroupId, setTriageGroupId] = useState('');
  const [isSavingTriage, setIsSavingTriage] = useState(false);
  const [waGroups, setWaGroups] = useState([]);

  // Group Response State
  const [allowGroups, setAllowGroups] = useState(false);
  const [isSavingAllowGroups, setIsSavingAllowGroups] = useState(false);

  // Advanced Config States
  const [advConfig, setAdvConfig] = useState({
    typing_delay: 1200,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    max_tokens: 800,
    persona: ''
  });
  const [isSavingAdv, setIsSavingAdv] = useState(false);
  const [isAdvOpen, setIsAdvOpen] = useState(false);

  useDocumentTitle('Pengaturan CS AI & WhatsApp — FiberPulse');

  useEffect(() => {
    fetchKeys();
    fetchGlobalStatus();
    fetchInstanceName();
    fetchEvoConfig();
    fetchHandoverDuration();
    fetchTriageConfig();
    fetchWaGroups();
    fetchAdvConfig();
    fetchGroupConfig();
  }, []);

  const fetchGroupConfig = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/group-response-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && typeof data.allow_groups !== 'undefined') {
        setAllowGroups(data.allow_groups);
      }
    } catch (error) {
      console.error('Gagal memuat setting respon grup:', error);
    }
  };

  const handleToggleAllowGroups = async () => {
    const nextState = !allowGroups;
    setIsSavingAllowGroups(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/group-response-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ allow_groups: nextState })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAllowGroups(data.allow_groups);
        toast.success(data.allow_groups ? 'Respon Grup WhatsApp Diaktifkan!' : 'Respon Grup WhatsApp Dinonaktifkan!');
      } else {
        toast.error('Gagal memperbarui pengaturan respon grup.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSavingAllowGroups(false);
    }
  };

  const fetchAdvConfig = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/advanced-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) setAdvConfig(data);
    } catch (e) {}
  };

  const fetchInstanceName = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/instance-name`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.instance_name) {
        setInstanceName(data.instance_name);
        checkWaStatus();
      }
    } catch (error) {}
  };

  const handleSaveInstanceName = async () => {
    if (!instanceName.trim()) return;
    setIsSavingInstance(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/instance-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instance_name: instanceName.trim() })
      });
      if (res.ok) {
        toast.success("Nama instance disimpan!");
        checkWaStatus();
      } else {
        toast.error("Gagal menyimpan nama instance.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsSavingInstance(false);
    }
  };

  const handleSaveAdvConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingAdv(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/advanced-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(advConfig)
      });
      if (res.ok) toast.success('Advanced AI Config tersimpan!');
      else toast.error('Gagal menyimpan Advanced Config');
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsSavingAdv(false);
    }
  };

  const handleResetAdvConfig = async () => {
    if (!confirm('Anda yakin ingin mereset konfigurasi AI ke default pabrik?')) return;
    const defaultPayload = {
      typing_delay: 1200,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      max_tokens: 800,
      persona: "Kamu adalah Customer Service AI dari FIBERPULSE TECHNOLOGIES INC. (FiberPulse).\nATURAN UTAMA:\n1. JIKA PELANGGAN HANYA MENYAPA (Halo/Ping/Siang) atau niatnya BELUM JELAS: Sambut dengan ramah dan tawarkan opsi bantuan (misal: Info Paket WiFi, Lapor Gangguan, Cek Area ODP, atau Status Tagihan).\n2. Gunakan bahasa Indonesia yang santai, luwes, dan natural. Jawab SEPINGKAT MUNGKIN dan langsung ke intinya (1-3 kalimat).\n3. Selalu utamakan REFERENSI JAWABAN (Knowledge Base) jika berkaitan dengan pertanyaan pelanggan.\n4. JIKA DAN HANYA JIKA kamu menjawab menggunakan REFERENSI yang memiliki instruksi [GAMBAR: namafile.jpg], sertakan tag tersebut di akhir balasanmu.\n5. JIKA pelanggan komplain keras atau kamu tidak menemukan jawaban di referensi, balas dengan sopan bahwa tim teknis FiberPulse akan segera membantu, lalu eskalasi ke Admin."
    };
    setIsSavingAdv(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/advanced-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(defaultPayload)
      });
      if (res.ok) {
        setAdvConfig(defaultPayload);
        toast.success('Advanced AI Config direset ke default!');
      }
    } catch (error) { toast.error('Gagal reset jaringan'); }
    finally { setIsSavingAdv(false); }
  };

  const fetchHandoverDuration = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/handover-duration`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && typeof data.duration !== 'undefined') {
        setHandoverDuration(data.duration.toString());
      }
    } catch (error) {}
  };

  const handleSaveHandover = async (e) => {
    e.preventDefault();
    setIsSavingHandover(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/handover-duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ duration: Number(handoverDuration) })
      });
      if (res.ok) toast.success("Durasi Handover AI berhasil disimpan!");
      else toast.error("Gagal menyimpan durasi.");
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingHandover(false);
    }
  };

  const fetchTriageConfig = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/triage-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) {
        setTriageDbIntegration(data.ai_db_integration);
        setTriageGroupId(data.ai_notification_group_id || '');
      }
    } catch (error) {}
  };

  const handleSaveTriageConfig = async (e) => {
    e.preventDefault();
    setIsSavingTriage(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/triage-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ai_db_integration: triageDbIntegration,
          ai_notification_group_id: triageGroupId
        })
      });
      if (res.ok) toast.success("Konfigurasi Triage AI berhasil disimpan!");
      else toast.error("Gagal menyimpan triage.");
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingTriage(false);
    }
  };

  const fetchWaGroups = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/evolution/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setWaGroups(data);
      }
    } catch (error) {
      console.error("Gagal load grup WA:", error);
    }
  };

  const fetchEvoConfig = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/evo-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) {
        setEvoUrl(data.evolution_api_url || '');
        setEvoKey(data.evolution_api_key || '');
        setIgnoredNumbers(data.ignored_numbers || '');
      }
    } catch (e) {}
  };

  const handleSaveEvoConfig = async (e) => {
    e.preventDefault();
    setIsSavingEvoConfig(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/evo-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          url: evoUrl.trim(),
          key: evoKey.trim(),
          evolution_api_url: evoUrl.trim(),
          evolution_api_key: evoKey.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success || data.url)) {
        toast.success("Konfigurasi server Evolution berhasil disimpan!");
        checkWaStatus();
      } else {
        toast.error(data.message || "Gagal menyimpan konfigurasi server.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsSavingEvoConfig(false);
    }
  };

  const handleSaveIgnoredNumbers = async (e) => {
    e.preventDefault();
    setSavingIgnored(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/ignored-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ignored_numbers: ignoredNumbers })
      });
      if (res.ok) toast.success("Daftar nomor pengecualian disimpan!");
      else toast.error("Gagal menyimpan blacklist.");
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setSavingIgnored(false);
    }
  };

  const checkWaStatus = async () => {
    setWaStatus('loading');
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/evolution/status?t=${new Date().getTime()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWaStatus(data.status);
      
      if (data.status !== 'open') {
        fetchQrCode();
      }
    } catch (e) {
      console.error('Gagal cek status WA');
      setWaStatus('close');
      fetchQrCode();
    }
  };

  const fetchQrCode = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/evolution/qr?t=${new Date().getTime()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.base64) {
        setQrCode(data.base64);
      } else if (data.status === 'open') {
        setWaStatus('open');
      }
    } catch (e) {
      console.error('Gagal fetch QR');
    }
  };

  const handleRequestPairingCode = async (e) => {
    if (e) e.preventDefault();
    if (!pairingPhone.trim()) {
      toast.error("Masukkan nomor WhatsApp terlebih dahulu!");
      return;
    }
    setIsRequestingPairingCode(true);
    setPairingCode('');
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/evolution/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone_number: pairingPhone.trim() })
      });
      const data = await res.json();
      if (res.ok && data.pairing_code && data.pairing_code.length <= 12 && !data.pairing_code.startsWith('2@')) {
        setPairingCode(data.pairing_code);
        toast.success("Kode pairing 8 digit berhasil didapatkan!");
      } else {
        toast.error(data.error || "Gagal meminta kode pairing.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsRequestingPairingCode(false);
    }
  };

  const handleLogoutWa = async () => {
    if (window.confirm('Yakin ingin logout WhatsApp CS?')) {
      setWaStatus('loading');
      setQrCode(null);
      try {
        const token = localStorage.getItem('sanctum_token');
        await fetch(`${API_URL}/evolution/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('WhatsApp berhasil dilogout');
        setTimeout(checkWaStatus, 2000);
      } catch (e) {
        toast.error('Gagal logout WhatsApp');
        checkWaStatus();
      }
    }
  };

  const fetchGlobalStatus = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/global-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && typeof data.is_active !== 'undefined') {
        setGlobalStatus(data.is_active);
      }
    } catch (error) {
      console.error('Gagal memuat status global AI');
    }
  };

  const handleToggleGlobal = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/global-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setGlobalStatus(data.is_active);
      toast.success(data.is_active ? 'Sistem CS AI Diaktifkan' : 'Sistem CS AI Dimatikan');
    } catch (error) {
      toast.error('Gagal mengubah status sistem');
    }
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApiKeys(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newKey) return;

    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, key: newKey, name: newName })
      });
      
      if (res.ok) {
        toast.success('API Key berhasil ditambahkan!');
        setNewKey('');
        setNewName('');
        fetchKeys();
      } else {
        toast.error('Gagal menambahkan API Key');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleToggleActive = async (key) => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/${key.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !key.is_active })
      });
      
      if (res.ok) fetchKeys();
      else toast.error('Gagal mengubah status');
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("API Key akan dihapus secara permanen. Lanjutkan?")) {
      try {
        const token = localStorage.getItem('sanctum_token');
        const res = await fetch(`${API_URL}/api-keys/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          toast.success('API Key telah dihapus.');
          fetchKeys();
        } else toast.error('Gagal menghapus');
      } catch (error) {
        toast.error('Terjadi kesalahan jaringan');
      }
    }
  };

  const handleResetErrors = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/api-keys/reset-errors`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Error count telah di-reset.');
        fetchKeys();
      } else toast.error('Gagal mereset error');
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
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
            Pengaturan CS AI & Server WhatsApp
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Manajemen API Key Multi-Failover, Integrasi Server WhatsApp, L1 Helpdesk Triage, dan Basis Pengetahuan AI.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '6px',
            backgroundColor: globalStatus ? '#ECFDF5' : '#FEF2F2',
            color: globalStatus ? '#059669' : '#DC2626',
            border: `1px solid ${globalStatus ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <Bot size={13} /> {globalStatus ? 'AI Engine Aktif' : 'AI Engine Nonaktif'}
          </span>
          <button 
            onClick={handleToggleGlobal} 
            style={{ 
              background: globalStatus ? '#FEF2F2' : '#ECFDF5', 
              color: globalStatus ? '#DC2626' : '#059669', 
              border: `1px solid ${globalStatus ? '#FECACA' : '#A7F3D0'}`, 
              padding: '6px 14px', 
              borderRadius: '8px', 
              fontWeight: 700, 
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            {globalStatus ? 'Matikan AI Global' : 'Hidupkan AI Global'}
          </button>
        </div>
      </div>

      {/* Top 2 Cards: Koneksi WhatsApp & Server Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* Card 1: WA Scanner Section */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={16} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
                Koneksi WhatsApp
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>Instance:</span>
                <input 
                  type="text" 
                  value={instanceName} 
                  onChange={(e) => setInstanceName(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '80px', fontSize: '0.7rem', fontWeight: 700, color: '#152C4A' }}
                />
                <button 
                  onClick={handleSaveInstanceName}
                  disabled={isSavingInstance}
                  style={{ background: '#2563EB', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Simpan Nama Instance"
                >
                  <Save size={10} />
                </button>
              </div>
            </div>

            <div>
              {waStatus === 'open' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                  <CheckCircle2 size={12} /> Terhubung
                </span>
              ) : waStatus === 'loading' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                  <RefreshCw size={12} className="animate-spin" /> Memeriksa...
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                  <AlertTriangle size={12} /> Menunggu Scan
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            {waStatus === 'open' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#152C4A', margin: '0 0 4px 0' }}>WhatsApp Siap Digunakan</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>Nomor CS telah berhasil dihubungkan ke server Evolution API dan sistem AI siap membalas pelanggan secara otomatis.</p>
                </div>
                <button 
                  onClick={handleLogoutWa}
                  style={{ background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <LogOut size={14} /> Logout WhatsApp
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Segmented Switcher */}
                <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => setPairingMode('qr')}
                    style={{
                      padding: '4px 12px', border: 'none', fontSize: '0.725rem', fontWeight: 700, cursor: 'pointer',
                      backgroundColor: pairingMode === 'qr' ? '#FFFFFF' : 'transparent',
                      color: pairingMode === 'qr' ? '#2563EB' : '#64748B',
                      boxShadow: pairingMode === 'qr' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease'
                    }}
                  >
                    <QrCode size={13} /> Scan QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPairingMode('phone')}
                    style={{
                      padding: '4px 12px', border: 'none', fontSize: '0.725rem', fontWeight: 700, cursor: 'pointer',
                      backgroundColor: pairingMode === 'phone' ? '#FFFFFF' : 'transparent',
                      color: pairingMode === 'phone' ? '#2563EB' : '#64748B',
                      boxShadow: pairingMode === 'phone' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease'
                    }}
                  >
                    <Smartphone size={13} /> Tautkan via No. HP (Pairing Code)
                  </button>
                </div>

                {pairingMode === 'qr' ? (
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '150px', height: '150px', flexShrink: 0, background: '#F8FAFC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      {qrCode ? (
                        <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '10px' }}>
                          <RefreshCw size={20} className={waStatus === 'loading' ? 'animate-spin' : ''} style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '0.7rem' }}>Server belum merespons QR.</div>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#152C4A', margin: '0 0 6px 0' }}>Tautkan dengan Kamera</h3>
                      <ol style={{ paddingLeft: '1rem', color: '#475569', fontSize: '0.725rem', lineHeight: '1.5', margin: '0 0 0.75rem 0' }}>
                        <li>Buka WhatsApp di HP CS Anda.</li>
                        <li>Pilih Menu &gt; <strong>Perangkat Tertaut</strong>.</li>
                        <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                        <li>Arahkan kamera ke QR Code di samping.</li>
                      </ol>
                      <button 
                        onClick={checkWaStatus}
                        style={{ background: 'white', color: '#152C4A', border: '1px solid #CBD5E1', padding: '5px 12px', borderRadius: '8px', fontSize: '0.725rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <RefreshCw size={12} /> Refresh QR Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Nomor WhatsApp CS <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Contoh: 085234422311 atau 62852..."
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRequestPairingCode(e); }}
                          style={{ flex: 1, padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', fontWeight: 600, outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={handleRequestPairingCode}
                          disabled={isRequestingPairingCode}
                          className="sgt-btn-primary"
                          style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                        >
                          {isRequestingPairingCode ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Meminta Kode...</span>
                            </>
                          ) : (
                            <>
                              <KeyRound size={13} />
                              <span>Dapatkan Kode</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Display Pairing Code if available */}
                    {pairingCode && (
                      <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#15803D', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            KODE PAIRING WHATSAPP (8 DIGIT)
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', fontFamily: 'monospace', letterSpacing: '0.15em', marginTop: '2px' }}>
                            {pairingCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pairingCode.replace(/[\s-]+/g, ''));
                            setHasCopiedPairingCode(true);
                            toast.success("Kode pairing disalin!");
                            setTimeout(() => setHasCopiedPairingCode(false), 2500);
                          }}
                          style={{ padding: '6px 12px', backgroundColor: hasCopiedPairingCode ? '#DCFCE7' : '#FFFFFF', border: '1px solid #86EFAC', borderRadius: '6px', color: '#15803D', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {hasCopiedPairingCode ? <Check size={12} /> : <Copy size={12} />}
                          <span>{hasCopiedPairingCode ? 'Tersalin' : 'Salin Kode'}</span>
                        </button>
                      </div>
                    )}

                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <ol style={{ paddingLeft: '1rem', color: '#475569', fontSize: '0.7rem', lineHeight: '1.5', margin: 0 }}>
                        <li>Buka WhatsApp di HP CS Anda ➔ Menu (titik tiga) ➔ <strong>Perangkat Tertaut</strong>.</li>
                        <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                        <li>Di bagian bawah layar pemindai kamera HP, ketuk <strong>"Tautkan dengan nomor telepon saja"</strong>.</li>
                        <li>Masukkan 8 digit kode pairing di atas.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Evolution API Server Config */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={16} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
              Konfigurasi Server Evolution
            </h2>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
              Pastikan Anda sudah menginstall Evolution API di server. Masukkan <strong>Base URL</strong> (tanpa endpoint trailing).
            </p>
            <form onSubmit={handleSaveEvoConfig}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Evolution API URL</label>
                <input 
                  type="url" 
                  required
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  placeholder="https://wa.fiberpulse.io"
                  value={evoUrl}
                  onChange={(e) => setEvoUrl(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Global API Key</label>
                <input 
                  type="password" 
                  required
                  style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  placeholder="Authentication Key..."
                  value={evoKey}
                  onChange={(e) => setEvoKey(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSavingEvoConfig} 
                className="sgt-btn-primary"
                style={{ width: '100%', padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                {isSavingEvoConfig ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Konfigurasi Server
              </button>
            </form>
          </div>
        </div>

      </div>
      
      {/* AI Enterprise Workflow (Triage) */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} />
          </div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
            AI Enterprise Workflow (Triage)
          </h2>
        </div>

        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
          Konfigurasi ini memungkinkan AI beroperasi sebagai <strong>L1 Helpdesk</strong>. Jika integrasi database dimatikan, AI hanya akan mengumpulkan keluhan dan melempar ringkasan hasil wawancara ke Grup Teknisi.
        </p>

        <form onSubmit={handleSaveTriageConfig}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#152C4A', margin: '0 0 2px 0' }}>Integrasi Database Otomatis</h3>
              <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>Jika OFF, AI hanya mengumpulkan keluhan tanpa membuat tiket database langsung.</p>
            </div>
            <div 
              onClick={() => setTriageDbIntegration(!triageDbIntegration)}
              style={{ 
                width: '40px', height: '22px', background: triageDbIntegration ? '#2563EB' : '#CBD5E1', 
                borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                width: '16px', height: '16px', background: 'white', borderRadius: '50%', 
                position: 'absolute', top: '3px', left: triageDbIntegration ? '21px' : '3px', transition: 'left 0.2s' 
              }} />
            </div>
          </div>

          {!triageDbIntegration && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>ID Grup WhatsApp Teknisi (Wajib)</label>
              <select 
                required={!triageDbIntegration}
                style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A' }}
                value={triageGroupId}
                onChange={(e) => setTriageGroupId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Grup WhatsApp --</option>
                {waGroups.length > 0 ? (
                  waGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.subject} ({g.id})</option>
                  ))
                ) : (
                  <option value="" disabled>Sedang memuat grup atau bot belum terhubung...</option>
                )}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSavingTriage} className="sgt-btn-primary" style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {isSavingTriage ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan Konfigurasi Triage
            </button>
          </div>
        </form>
      </div>

      {/* Handover, Group Response, & Blacklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Handover Behavior */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#152C4A', margin: '0 0 4px 0' }}>Admin Handover Duration</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
              Berapa lama AI dinonaktifkan otomatis saat Admin membalas pesan pelanggan? Isi <strong>0</strong> untuk mematikan AI sampai dihidupkan manual.
            </p>
          </div>
          <form onSubmit={handleSaveHandover} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Durasi (Menit)</label>
              <input 
                type="number" 
                min="0" 
                required
                style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box' }}
                value={handoverDuration}
                onChange={(e) => setHandoverDuration(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isSavingHandover} className="sgt-btn-primary" style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isSavingHandover ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan
            </button>
          </form>
        </div>

        {/* Respon Pesan Grup WhatsApp */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} />
              </div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#152C4A', margin: 0 }}>Respon Pesan Grup WhatsApp</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '6px 0 1rem 0', lineHeight: 1.4 }}>
              Jika <strong>NONAKTIF</strong> (Rekomendasi), AI akan mengabaikan seluruh pesan dari Grup WhatsApp agar tidak mengganggu obrolan grup internal/teknisi.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: allowGroups ? '#059669' : '#64748B' }}>
              {allowGroups ? '🟢 AI Aktif di Grup WA' : '⚪ AI Nonaktif di Grup'}
            </span>
            <div 
              onClick={handleToggleAllowGroups}
              style={{ 
                width: '40px', height: '22px', background: allowGroups ? '#2563EB' : '#CBD5E1', 
                borderRadius: '20px', position: 'relative', cursor: isSavingAllowGroups ? 'wait' : 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                width: '16px', height: '16px', background: 'white', borderRadius: '50%', 
                position: 'absolute', top: '3px', left: allowGroups ? '21px' : '3px', transition: 'left 0.2s' 
              }} />
            </div>
          </div>
        </div>

        {/* Blacklist AI */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#152C4A', margin: '0 0 4px 0' }}>Pengecualian Nomor (Blacklist AI)</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
              Nomor pelanggan atau teknisi yang <strong>tidak boleh</strong> dijawab AI. Pisahkan dengan koma (contoh: <code>6281234567, 081234567</code>).
            </p>
          </div>
          <form onSubmit={handleSaveIgnoredNumbers} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea 
              rows="2"
              style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
              placeholder="62812345678, 62898765432"
              value={ignoredNumbers}
              onChange={(e) => setIgnoredNumbers(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={savingIgnored} className="sgt-btn-primary" style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {savingIgnored ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Blacklist
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* API Key Management (Grid 1:2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Left: Add API Key Form */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
              Tambah API Key Baru
            </h2>
          </div>

          <form onSubmit={handleAddKey}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Provider AI</label>
              <select 
                style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A' }}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Nama / Label (Opsional)</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                placeholder="Misal: Key Utama, Backup"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>API Key</label>
              <input 
                type="password" 
                required
                style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', fontFamily: 'monospace', boxSizing: 'border-box' }}
                placeholder="Paste API Key..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>

            <button type="submit" className="sgt-btn-primary" style={{ width: '100%', padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> Simpan API Key
            </button>
          </form>

          <div style={{ background: '#FFFBEB', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #FEF3C7', fontSize: '0.7rem', color: '#92400E', display: 'flex', gap: '6px', marginTop: '0.85rem' }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Sistem otomatis rotasi (failover) ke key berikutnya jika limit tercapai.</span>
          </div>
        </div>

        {/* Right: API Key Table (2 cols) */}
        <div className="lg:col-span-2" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={16} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
                Daftar API Key Aktif
              </h2>
            </div>
            <button onClick={handleResetErrors} style={{ background: 'white', color: '#152C4A', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.7rem', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
              <RotateCcw size={12} /> Reset Error
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 14px', fontWeight: 700 }}>PROVIDER &amp; LABEL</th>
                  <th style={{ padding: '8px 14px', fontWeight: 700 }}>API KEY</th>
                  <th style={{ padding: '8px 14px', fontWeight: 700, textAlign: 'center' }}>ERROR</th>
                  <th style={{ padding: '8px 14px', fontWeight: 700, textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '8px 14px', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading && apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Memuat data...</td>
                  </tr>
                ) : apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Belum ada API Key yang tersimpan.</td>
                  </tr>
                ) : apiKeys.map((key, idx) => (
                  <tr key={key.id} style={{ borderBottom: idx === apiKeys.length - 1 ? 'none' : '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE' }}>
                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#152C4A', textTransform: 'capitalize' }}>
                        {key.provider}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {key.name || 'Tanpa Label'}
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: '#64748B', fontSize: '0.75rem' }}>
                      {key.key.substring(0, 6)}••••••••••••{key.key.substring(key.key.length - 4)}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      {key.error_count > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                          <AlertTriangle size={10} /> {key.error_count}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <div onClick={() => handleToggleActive(key)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                        <StatusBadge status={key.is_active ? 'Aktif' : 'Nonaktif'} />
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(key.id)} 
                        title="Hapus Key"
                        style={{ color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Advanced AI Settings Collapsible */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1rem 1.25rem', backgroundColor: '#FFFFFF' }} 
          onClick={() => setIsAdvOpen(!isAdvOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={16} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>
              Advanced AI Settings (Konfigurasi Otak AI)
            </h2>
          </div>
          <div style={{ transform: isAdvOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748B' }}>
            <ChevronDown size={18} />
          </div>
        </div>
        
        {isAdvOpen && (
          <div style={{ padding: '1.25rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ background: '#FFFBEB', color: '#92400E', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', gap: '8px', fontSize: '0.75rem', border: '1px solid #FEF3C7' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Perhatian:</strong> Menu ini mengatur langsung cara kerja kecerdasan buatan. Mengubah tanpa pemahaman dapat menyebabkan respons AI tidak akurat.
              </div>
            </div>

            <form onSubmit={handleSaveAdvConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Model AI Engine</label>
                  <select 
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A' }}
                    value={advConfig.model}
                    onChange={(e) => setAdvConfig({...advConfig, model: e.target.value})}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Pintar &amp; Cepat)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Super Cepat)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Sangat Teliti)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Jeda Mengetik / Typing Delay (ms)</label>
                  <input 
                    type="number" min="0" max="10000"
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                    value={advConfig.typing_delay}
                    onChange={(e) => setAdvConfig({...advConfig, typing_delay: parseInt(e.target.value) || 0})}
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0' }}>0 = Instan. 1500 = 1,5 detik.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Tingkat Kreativitas (Temperature: {advConfig.temperature})</label>
                  <input 
                    type="range" min="0.1" max="1.5" step="0.1"
                    style={{ width: '100%', accentColor: '#2563EB' }}
                    value={advConfig.temperature}
                    onChange={(e) => setAdvConfig({...advConfig, temperature: parseFloat(e.target.value)})}
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '2px 0 0 0' }}>Mendekati 0.1 = Kaku &amp; Faktual. Mendekati 1.5 = Kreatif.</p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Batas Panjang Balasan (Max Tokens)</label>
                  <input 
                    type="number" min="100" max="8192"
                    style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                    value={advConfig.max_tokens}
                    onChange={(e) => setAdvConfig({...advConfig, max_tokens: parseInt(e.target.value) || 800})}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Karakter &amp; Instruksi (System Prompt)</label>
                <textarea 
                  rows="6"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none', fontSize: '0.75rem', color: '#152C4A', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  value={advConfig.persona}
                  onChange={(e) => setAdvConfig({...advConfig, persona: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button type="submit" disabled={isSavingAdv} className="sgt-btn-primary" style={{ flex: 1, padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  {isSavingAdv ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Simpan Konfigurasi Otak AI
                </button>
                <button type="button" onClick={handleResetAdvConfig} disabled={isSavingAdv} style={{ padding: '0.6rem 1rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} />
                  Reset Default
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <AISandboxPanel />
      <MediaLibraryPanel />
      <AiKnowledgeBasePanel />
    </div>
  );
};

