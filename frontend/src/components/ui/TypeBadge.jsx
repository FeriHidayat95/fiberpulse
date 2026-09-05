import React from 'react';

export const TypeBadge = ({ type }) => {
  if (!type) return <span style={{fontSize: '0.75rem', color: '#94A3B8'}}>-</span>;
  
  const lower = type.toLowerCase();
  let label = type;
  let bg = '#F1F5F9';
  let color = '#334155';
  let dot = '#64748B';
  let border = '#E2E8F0';

  if (lower.includes('pasang') || lower.includes('instal') || lower.includes('psb') || lower.includes('baru')) {
    label = 'Pasang Baru';
    bg = '#DBEAFE';
    color = '#1E40AF';
    dot = '#2563EB';
    border = '#BFDBFE';
  } else if (lower.includes('mainten') || lower.includes('perbaik') || lower.includes('gangguan') || lower.includes('pemelihara') || lower.includes('service')) {
    label = 'Maintenance';
    bg = '#FEF3C7';
    color = '#92400E';
    dot = '#D97706';
    border = '#FDE68A';
  } else if (lower.includes('cabut') || lower.includes('bongkar') || lower.includes('putus') || lower.includes('discon')) {
    label = 'Pencabutan';
    bg = '#FEE2E2';
    color = '#991B1B';
    dot = '#DC2626';
    border = '#FECACA';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0.25rem 0.65rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: bg,
      color: color,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dot
      }}></span>
      {label}
    </span>
  );
};
