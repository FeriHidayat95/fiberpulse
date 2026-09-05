import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export const SearchableSelect = ({ options = [], value, onChange, placeholder = "Pilih...", optgroupLabel = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = Array.isArray(options) ? options : [];

  // Filter options based on search term
  const filteredOptions = safeOptions.filter(opt => {
    if (!opt) return false;
    if (opt.isOptgroup) return true; // keep headers
    return String(opt.label || '').toLowerCase().includes((search || '').toLowerCase());
  });

  const selectedOption = safeOptions.find(o => o && o.value === value && !o.isOptgroup);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected Value Box */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '0.75rem 1rem', border: '1px solid #E2E8F0', 
          borderRadius: '8px', color: selectedOption ? '#1E293B' : '#94A3B8', 
          backgroundColor: 'white', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 1050,
          maxHeight: '300px', display: 'flex', flexDirection: 'column'
        }}>
          {/* Search Input */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              style={{
                width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem',
                border: '1px solid #E2E8F0', borderRadius: '4px',
                fontSize: '0.875rem', outline: 'none'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.25rem' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#94A3B8', textAlign: 'center' }}>
                Tidak ada hasil
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                if (opt.isOptgroup) {
                  return (
                    <div key={`group-${idx}`} style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', backgroundColor: '#F8FAFC', marginTop: idx === 0 ? 0 : '0.5rem' }}>
                      {opt.label}
                    </div>
                  );
                }
                
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#1E293B',
                      cursor: 'pointer', borderRadius: '4px',
                      backgroundColor: value === opt.value ? '#EFF6FF' : 'transparent',
                      color: value === opt.value ? '#3B82F6' : '#1E293B'
                    }}
                    onMouseEnter={(e) => {
                      if (value !== opt.value) e.currentTarget.style.backgroundColor = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
