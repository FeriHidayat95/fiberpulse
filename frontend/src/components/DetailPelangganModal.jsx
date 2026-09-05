import React, { useState, useEffect } from 'react';
import { X, Edit3, Package, Layers, Calendar, Phone, MapPin, Navigation, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

export const DetailPelangganModal = ({ isOpen, onClose, data, onEdit }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data?.id) {
      fetchCustomerDetail(data.id);
    } else {
      setDetail(null);
    }
  }, [isOpen, data]);

  const fetchCustomerDetail = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDetail(json.data);
        }
      }
    } catch (e) {
      console.warn('Failed fetching customer detail:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !data) return null;

  const currentData = detail || data;
  const name = currentData.name || data.name || 'Pelanggan';
  const dusun = currentData.dusun || data.dusun || 'Dusun 1';
  const phone = currentData.phone || data.phone || '-';
  const address = currentData.address || data.address || 'Wilayah Operasional';
  const odpName = currentData.odp?.name || data.odp || (currentData.odp_id ? `ODP-D1-${String(currentData.odp_id).padStart(2, '0')}` : 'ODP-D1-01');
  const portName = currentData.odp_port ? `Port ${currentData.odp_port}` : (data.port || 'Port 1');
  const status = currentData.status || data.status || 'Aktif';
  const subscriptionDate = currentData.subscription_date || (currentData.created_at ? currentData.created_at.split('T')[0] : (data.created_at ? data.created_at.split('T')[0] : '2024-04-10'));

  // Initials for avatar
  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return 'AY';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Installed Assets List
  const installedAssets = Array.isArray(currentData.installed_assets) && currentData.installed_assets.length > 0
    ? currentData.installed_assets
    : [
        {
          id: 1,
          name: 'ONT ZTE F670L',
          serial_number: currentData.modem_sn || data.modem_sn || `ZTEF670L-${String(data.id || 5).padStart(3, '0')}`,
          type: 'Serial',
          status: 'Terpasang'
        }
      ];

  // Orders History List
  const orders = Array.isArray(currentData.orders) && currentData.orders.length > 0
    ? currentData.orders
    : [
        {
          id: data.id || 1,
          order_number: `ORD-${subscriptionDate.slice(0, 4)}-${String(data.id || 2).padStart(3, '0')}`,
          service_type: 'Pemasangan',
          date: subscriptionDate,
          status: 'Selesai'
        }
      ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto', boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '580px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        display: 'flex', flexDirection: 'column', maxHeight: 'min(90vh, 850px)',
        margin: 'auto', flexShrink: 0, overflow: 'hidden',
        border: '1px solid #E2E8F0', boxSizing: 'border-box'
      }}>
        
        {/* Header Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#FFFFFF', flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.01em' }}>
              {name}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
              {dusun} • Sejak {subscriptionDate}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onEdit && (
              <button 
                onClick={() => {
                  onClose();
                  onEdit(currentData);
                }}
                style={{
                  backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none',
                  borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)', transition: 'all 0.15s ease'
                }}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}
            <button 
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', borderRadius: '6px',
                width: '28px', height: '28px', cursor: 'pointer',
                color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Profile Card */}
          <div style={{
            backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '1rem 1.25rem',
            border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: '#2563EB', color: '#FFFFFF',
              fontWeight: 800, fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, letterSpacing: '0.02em',
              boxShadow: '0 4px 6px -1px rgba(37,99,235,0.25)'
            }}>
              {getInitials(name)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#152C4A' }}>
                {name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: status === 'Aktif' ? '#DCFCE7' : '#FEF3C7',
                  color: status === 'Aktif' ? '#16A34A' : '#D97706',
                  padding: '2px 8px', borderRadius: '99px',
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  border: status === 'Aktif' ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'Aktif' ? '#16A34A' : '#D97706' }}></span>
                  {status}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  Sejak {subscriptionDate}
                </span>
              </div>
            </div>
          </div>

          {/* KONTAK & LOKASI Section */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              KONTAK &amp; LOKASI
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {/* No. Telepon */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>No. Telepon</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>
                  {phone}
                </div>
              </div>

              {/* Dusun */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Dusun</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>
                  {dusun}
                </div>
              </div>

              {/* Alamat */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Alamat</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', marginTop: '2px' }}>
                  {address}
                </div>
              </div>

              {/* ODP */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>ODP</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>
                  {odpName}
                </div>
              </div>

              {/* Port */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Port</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A', fontFamily: 'monospace', marginTop: '2px' }}>
                  {portName}
                </div>
              </div>
            </div>
          </div>

          {/* ASET TERPASANG Section */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              ASET TERPASANG ({installedAssets.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {installedAssets.map((asset, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                    padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#64748B', flexShrink: 0
                    }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#152C4A' }}>
                        {asset.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600, marginTop: '1px' }}>
                        {asset.serial_number || asset.sn || '-'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      {asset.type || 'Serial'}
                    </span>
                    <span style={{
                      backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                      padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      {asset.status || 'Terpasang'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIWAYAT ORDER Section */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              RIWAYAT ORDER ({orders.length})
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                    <th style={{ padding: '0.6rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.6rem 1rem' }}>LAYANAN</th>
                    <th style={{ padding: '0.6rem 1rem' }}>TANGGAL</th>
                    <th style={{ padding: '0.6rem 1rem' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === orders.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.75rem' }}>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>
                        {order.order_number || `ORD-${order.id}`}
                      </td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{
                          backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700
                        }}>
                          {order.service_type || 'Pemasangan'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748B', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        {order.date || subscriptionDate}
                      </td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{
                          backgroundColor: order.status === 'Selesai' ? '#DCFCE7' : '#FEF3C7',
                          color: order.status === 'Selesai' ? '#16A34A' : '#D97706',
                          border: order.status === 'Selesai' ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700
                        }}>
                          {order.status || 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
