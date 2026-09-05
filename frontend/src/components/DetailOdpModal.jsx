import React from 'react';
import { X, MapPin, Wifi, CheckCircle2, Activity, Clock, Navigation, Layers, ShieldCheck, Server, ExternalLink } from 'lucide-react';

export const DetailOdpModal = ({ isOpen, onClose, odpData, onOpenMap }) => {
  if (!isOpen || !odpData) return null;

  const totalPorts = odpData.total_ports || odpData.kapasitas || odpData.raw?.total_ports || 8;
  const usedPorts = odpData.used_ports ?? odpData.terpakai ?? odpData.raw?.used_ports ?? 0;
  const availPorts = Math.max(0, totalPorts - usedPorts);
  const percentUsed = Math.round((usedPorts / totalPorts) * 100) || 0;

  const lat = odpData.latitude ?? odpData.lat ?? odpData.raw?.latitude;
  const lng = odpData.longitude ?? odpData.lng ?? odpData.raw?.longitude;
  const status = odpData.status || odpData.raw?.status || (availPorts === 0 ? 'Penuh' : (usedPorts >= totalPorts - 2 ? 'Hampir Penuh' : 'Available'));
  const address = odpData.address || odpData.raw?.address || odpData.description || odpData.raw?.description;

  const ports = Array.from({ length: totalPorts }, (_, i) => ({
    portNum: i + 1,
    status: i < usedPorts ? 'Terpakai' : 'Kosong'
  }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        border: '1px solid #E2E8F0', boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#F1F7FC',
              color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Server size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
                  {odpData.name || 'Detail ODP'}
                </h3>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800,
                  backgroundColor: status === 'Penuh' ? '#FEF2F2' : (status === 'Hampir Penuh' ? '#FFFBEB' : (status === 'Maintenance' || status === 'Rusak' ? '#F5F3FF' : '#ECFDF5')),
                  color: status === 'Penuh' ? '#DC2626' : (status === 'Hampir Penuh' ? '#D97706' : (status === 'Maintenance' || status === 'Rusak' ? '#7C3AED' : '#059669')),
                  border: `1px solid ${status === 'Penuh' ? '#FCA5A5' : (status === 'Hampir Penuh' ? '#FDE68A' : (status === 'Maintenance' || status === 'Rusak' ? '#DDD6FE' : '#A7F3D0'))}`
                }}>
                  {status}
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>
                Wilayah: {odpData.dusun || odpData.raw?.dusun || 'Wilayah Umum'} • {odpData.code || `ODP#${odpData.id || ''}`}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status Banner */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
            backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginBottom: '2px' }}>TOTAL PORT</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace' }}>{totalPorts} Port</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginBottom: '2px' }}>TERPAKAI</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{usedPorts} Port</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginBottom: '2px' }}>TERSEDIA</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: availPorts === 0 ? '#EF4444' : '#059669', fontFamily: 'monospace' }}>{availPorts} Port</div>
            </div>
          </div>

          {/* Port Usage Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <span style={{ color: '#334155' }}>Kapasitas Terpakai ({percentUsed}%)</span>
              <span style={{ color: availPorts === 0 ? '#EF4444' : '#059669' }}>
                {availPorts === 0 ? 'Penuh (Full)' : 'Siap Pakai'}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                width: `${percentUsed}%`, height: '100%',
                backgroundColor: percentUsed >= 90 ? '#EF4444' : (percentUsed >= 70 ? '#F59E0B' : '#2563EB'),
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          {/* Port Grid Visual */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              DISTRIBUSI PORT SPLITTER
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {ports.map((p) => {
                const isOccupied = p.status === 'Terpakai';
                return (
                  <div key={p.portNum} style={{
                    padding: '0.5rem', borderRadius: '8px', border: `1px solid ${isOccupied ? '#BFDBFE' : '#A7F3D0'}`,
                    backgroundColor: isOccupied ? '#EFF6FF' : '#ECFDF5', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>PORT {p.portNum}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isOccupied ? '#2563EB' : '#059669', marginTop: '2px' }}>
                      {p.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Address / Landmark Notes */}
          {address && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>PATOKAN / CATATAN LOKASI</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#334155' }}>
                {address}
              </div>
            </div>
          )}

          {/* GPS Coordinates & Dual Navigation */}
          {(lat || lng) && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>KOORDINAT LOKASI ODP</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>
                  {Number(lat || 0).toFixed(6)}, {Number(lng || 0).toFixed(6)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sgt-btn-primary"
                  style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#2563EB', color: '#FFFFFF' }}
                >
                  <ExternalLink size={11} /> Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                >
                  <Navigation size={11} /> Waze
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#F8FAFC' }}>
          {onOpenMap && (
            <button
              onClick={() => {
                onOpenMap(odpData);
                onClose();
              }}
              style={{
                padding: '5px 14px', borderRadius: '6px', backgroundColor: '#EFF6FF',
                color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.75rem',
                fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}
            >
              <MapPin size={13} /> Fokus di Peta
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
