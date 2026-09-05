import React from 'react';
import './ui.css';

export const StatusBadge = ({ status }) => {
  if (!status || status === '-') return <span className="status-badge" style={{backgroundColor: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0'}}>-</span>;

  const s = String(status).toLowerCase().trim();
  let bg = '#F1F5F9';
  let text = '#334155';
  let dot = '#64748B';
  let border = '#E2E8F0';

  if (s === 'aktif' || s === 'selesai' || s === 'baik' || s === 'disetujui' || s === 'verified' || s === 'success') {
    bg = '#D1FAE5'; text = '#065F46'; dot = '#10B981'; border = '#A7F3D0';
  } else if (s === 'diproses' || s === 'pending' || s === 'maintenance' || s === 'progress') {
    bg = '#FEF3C7'; text = '#92400E'; dot = '#F59E0B'; border = '#FDE68A';
  } else if (s === 'penuh' || s === 'rusak' || s === 'nonaktif' || s === 'batal' || s === 'ditolak' || s === 'scrap' || s === 'error') {
    bg = '#FEE2E2'; text = '#991B1B'; dot = '#EF4444'; border = '#FECACA';
  } else if (s === 'baru' || s === 'stok baru' || s === 'psb') {
    bg = '#DBEAFE'; text = '#1E40AF'; dot = '#3B82F6'; border = '#BFDBFE';
  } else if (s.includes('serial')) {
    bg = '#F3E8FF'; text = '#6B21A8'; dot = '#9333EA'; border = '#E9D5FF';
  } else if (s.includes('consumable') || s.includes('kabel') || s.includes('meter') || s.includes('roll')) {
    bg = '#DCFCE7'; text = '#15803D'; dot = '#22C55E'; border = '#BBF7D0';
  } else if (s.includes('modem') || s.includes('ont') || s.includes('onu')) {
    bg = '#E0F2FE'; text = '#0369A1'; dot = '#0EA5E9'; border = '#BAE6FD';
  } else if (s.includes('router') || s.includes('wifi') || s.includes('ap') || s.includes('access point') || s.includes('mikrotik')) {
    bg = '#E0E7FF'; text = '#3730A3'; dot = '#6366F1'; border = '#C7D2FE';
  } else if (s.includes('olt') || s.includes('switch') || s.includes('hub') || s.includes('passive') || s.includes('splitter') || s.includes('odp')) {
    bg = '#FCE7F3'; text = '#9D174D'; dot = '#EC4899'; border = '#FBCFE8';
  } else if (s.includes('cabut') || s.includes('ditarik') || s.includes('retur')) {
    bg = '#FFEDD5'; text = '#C2410C'; dot = '#F97316'; border = '#FED7AA';
  } else if (s.includes('unit') || s.includes('pcs') || s.includes('box')) {
    bg = '#F8FAFC'; text = '#475569'; dot = '#64748B'; border = '#E2E8F0';
  } else {
    // Generate a consistent subtle palette for any other custom asset category
    const palettes = [
      { bg: '#E0F2FE', text: '#0369A1', dot: '#0EA5E9', border: '#BAE6FD' }, // sky
      { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1', border: '#C7D2FE' }, // indigo
      { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899', border: '#FBCFE8' }, // pink
      { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' }, // amber
      { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' }, // emerald
      { bg: '#F3E8FF', text: '#6B21A8', dot: '#9333EA', border: '#E9D5FF' }, // purple
    ];
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const p = palettes[Math.abs(hash) % palettes.length];
    bg = p.bg; text = p.text; dot = p.dot; border = p.border;
  }

  return (
    <span 
      className="status-badge"
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dot
      }}></span>
      {status}
    </span>
  );
};
