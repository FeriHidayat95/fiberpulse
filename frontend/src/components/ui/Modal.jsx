import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = '600px', subtitle = null }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '1.5rem 1rem',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: maxWidth,
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'min(90vh, 850px)',
        margin: 'auto',
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <div>
            {typeof title === 'string' ? (
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#152C4A' }}>{title}</h2>
            ) : title}
            {subtitle && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 500 }}>{subtitle}</div>}
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '0 0 16px 16px', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
