import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Bot, Send, RefreshCw, CheckCircle2, XCircle, Play, Image as ImageIcon, Zap, Cpu, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const AISandboxPanel = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Test Suite States
  const [runningSuite, setRunningSuite] = useState(false);
  const [suiteResult, setSuiteResult] = useState(null);

  const presets = [
    { label: '👋 Salam Sapaan', prompt: 'Hallo' },
    { label: '📦 Brosur Paket Home', prompt: 'mana detail paketnya' },
    { label: '🏫 Paket Sekolah', prompt: 'ada paket untuk sekolah?' },
    { label: '📍 Cek Area Sumurgintung', prompt: 'sumur gintung tercover?' },
    { label: '⚠️ Lapor Gangguan', prompt: 'wifi mati lelet dari kemarin' }
  ];

  const handleSimulate = async (customPrompt = null) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) {
      toast.error('Masukkan pesan pengujian terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/ai/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      if (res.ok) {
        setSimResult(data);
        toast.success('Simulasi AI berhasil dieksekusi!');
      } else {
        toast.error(data.message || 'Gagal eksekusi simulasi');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTestSuite = async () => {
    setRunningSuite(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/ai/test-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuiteResult(data);
        toast.success(`Audit Skenario Selesai! Skor: ${data.score_percent}%`);
      } else {
        toast.error('Gagal menjalankan Audit Skenario');
      }
    } catch (e) {
      toast.error('Gagal terhubung ke server');
    } finally {
      setRunningSuite(false);
    }
  };

  return (
    <Card style={{ marginBottom: '2rem', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            <Sparkles size={20} color="#0284c7" /> 🧪 AI Sandbox Simulator &amp; Enterprise Prompt Tester
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
            Uji coba respon AI Gemini, pemicuan brosur gambar, dan inspeksi fungsi secara instan tanpa membuang kuota pesan WA
          </p>
        </div>

        <button
          onClick={handleRunTestSuite}
          disabled={runningSuite}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
            color: 'white', border: 'none', borderRadius: '10px',
            padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            cursor: runningSuite ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
          }}
        >
          {runningSuite ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
          {runningSuite ? 'Menjalankan Audit Skenario...' : '🚀 Audit Skenario Otomatis (5 Test Suite)'}
        </button>
      </div>

      <div className="card-content" style={{ padding: '1.25rem' }}>
        {/* Preset Prompt Shortcuts */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Shortcut Skenario Uji Coba Cepat:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => { setPrompt(p.prompt); handleSimulate(p.prompt); }}
                style={{
                  backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px',
                  padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, color: '#334155',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Execute Area */}
        <form onSubmit={(e) => { e.preventDefault(); handleSimulate(); }} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ketik simulasi pesan pelanggan di sini (misal: 'mau pasang baru', 'sumur gintung tercover?')..."
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '10px',
              border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '6px', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Simulasi...' : 'Kirim Simulasi'}
          </button>
        </form>

        {/* Real-Time Simulation Result Inspection Card */}
        {simResult && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} color="#0284c7" />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Hasil Inspeksi Respon AI Real-Time</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: '99px' }}>
                  <Zap size={11} style={{ display: 'inline', marginRight: '3px' }} /> Latensi: {simResult.latency_ms} ms
                </span>
                {simResult.is_greeting && (
                  <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: '99px' }}>
                    👋 Salam Sapaan (No Image)
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Simulasi Pesan Pelanggan:
                </label>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.85rem', color: '#1E40AF', fontWeight: 600, margin: '4px 0 12px 0' }}>
                  "{simResult.incoming_text}"
                </div>

                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Balasan Teks AI Gemini:
                </label>
                <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.85rem', fontSize: '0.875rem', color: '#0F172A', lineHeight: 1.5, margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {simResult.reply_text}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Media Brosur Terpicu:
                </label>
                {simResult.media_attached ? (
                  <div style={{ border: '1px solid #BAE6FD', borderRadius: '10px', overflow: 'hidden', background: '#F0F9FF', marginTop: '4px' }}>
                    <div style={{ height: '140px', background: '#0F172A' }}>
                      <img src={simResult.media_url} alt="Brosur Terpicu" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', textAlign: 'center', wordBreak: 'break-all' }}>
                      <ImageIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {simResult.media_attached}
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed #CBD5E1', borderRadius: '10px', padding: '2rem 1rem', textAlign: 'center', background: '#F8FAFC', marginTop: '4px' }}>
                    <ImageIcon size={24} color="#94A3B8" style={{ margin: '0 auto 4px auto' }} />
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tidak Ada Gambar Terlampir</div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Pesan ini diproses sebagai balasan teks murni</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Test Suite Audit Report Card */}
        {suiteResult && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#14532D' }}>Laporan Audit Skenario Enterprise</span>
              </div>
              <div style={{ background: '#16A34A', color: 'white', fontWeight: 900, padding: '4px 12px', borderRadius: '99px', fontSize: '0.85rem' }}>
                Skor Akurasi: {suiteResult.score_percent}% ({suiteResult.passed_count}/{suiteResult.total_count} Skenario Lulus)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suiteResult.scenarios.map((sc) => (
                <div key={sc.id} style={{ background: 'white', border: '1px solid #DCFCE7', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sc.passed ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#DC2626" />}
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0F172A' }}>{sc.name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Prompt: "{sc.prompt}" {sc.media_attached ? `➔ Media: ${sc.media_attached}` : '➔ (No Media)'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: sc.passed ? '#15803D' : '#B91C1C', background: sc.passed ? '#DCFCE7' : '#FEE2E2', padding: '2px 8px', borderRadius: '6px' }}>
                    {sc.passed ? 'PASSED' : 'FAILED'} ({sc.latency_ms}ms)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

