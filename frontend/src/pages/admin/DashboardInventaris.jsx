import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Layers, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const DashboardInventaris = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {
      total_skus: 0,
      hardware_units: 0,
      hardware_baru: 0,
      hardware_cabutan: 0,
      hardware_damaged: 0,
      material_meters: 0,
      material_baru: 0,
      material_cabutan: 0,
      material_damaged: 0,
      baru: 0,
      cabutan: 0,
      damaged: 0
    },
    by_category: [],
    low_stock: [],
    recent_transactions: []
  });

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/inventory?t=' + Date.now());
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Gagal memuat data inventaris:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      
      {/* Executive Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #EFF8FC 0%, #F1F6FA 100%)',
        border: '1px solid #D8E6F3',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: '#152C4A', color: 'white', padding: '3px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              INVENTORY HUB
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
            Dashboard Gudang & Inventaris Realtime
          </h1>
          <p style={{ color: '#475569', fontSize: '0.875rem', margin: '4px 0 0 0', fontWeight: 500 }}>
            Pemantauan terpisah untuk Perangkat Hardware (Unit) dan Material Consumable (Meter).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchInventoryData}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
              backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '10px',
              color: '#152C4A', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh Live</span>
          </button>
          <button 
            onClick={() => navigate('/admin/aset-masuk')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #42A1D3 0%, #2563EB 100%)', border: 'none', borderRadius: '10px',
              color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(66, 161, 211, 0.35)'
            }}
          >
            <ArrowDownLeft size={16} />
            <span>+ Restock Barang</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards (4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Card 1: Hardware Units */}
        <div 
          onClick={() => navigate('/admin/aset-gudang')} 
          style={{
            backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: '#EFF8FC', color: '#42A1D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={20} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#152C4A', backgroundColor: '#E2F1F8', padding: '3px 10px', borderRadius: '99px' }}>
              Hardware (Unit)
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>STOK HARDWARE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#152C4A', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.1 }}>
              {data.summary?.hardware_units || 0} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Unit Usable</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'flex', gap: '8px' }}>
              <span>📦 {data.summary?.hardware_baru || 0} Baru</span>
              <span>•</span>
              <span>🔄 {data.summary?.hardware_cabutan || 0} Cabutan</span>
            </div>
          </div>
        </div>

        {/* Card 2: Material Consumable */}
        <div 
          onClick={() => navigate('/admin/aset-gudang')} 
          style={{
            backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', backgroundColor: '#BBF7D0', padding: '3px 10px', borderRadius: '99px' }}>
              Consumable (Meter)
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>STOK KABEL FO</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.1 }}>
              {data.summary?.material_meters || 0} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#15803D' }}>Meter Usable</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600, display: 'flex', gap: '8px' }}>
              <span>📦 {data.summary?.material_baru || 0}m Baru</span>
              <span>•</span>
              <span>🔄 {data.summary?.material_cabutan || 0}m Cabutan</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stok Baru vs Cabutan */}
        <div 
          onClick={() => navigate('/admin/aset-gudang')} 
          style={{
            backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400E', backgroundColor: '#FDE68A', padding: '3px 10px', borderRadius: '99px' }}>
              Rincian Komposisi
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>BARU VS CABUTAN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '0.35rem 0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350F', display: 'flex', justifyContent: 'space-between' }}>
                <span>📦 Baru:</span>
                <span>{data.summary?.hardware_baru || 0} Unit | {data.summary?.material_baru || 0}m</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B45309', display: 'flex', justifyContent: 'space-between' }}>
                <span>🔄 Cabutan:</span>
                <span>{data.summary?.hardware_cabutan || 0} Unit | {data.summary?.material_cabutan || 0}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Damaged Assets */}
        <div 
          onClick={() => navigate('/admin/monitoring-rusak')} 
          style={{
            backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FECACA', padding: '3px 10px', borderRadius: '99px' }}>
              Perlu Tindakan
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ASET RUSAK / SCRAP</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.1 }}>
              {data.summary?.damaged || 0} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#B91C1C' }}>Item Rusak</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600, display: 'flex', gap: '8px' }}>
              <span>{data.summary?.hardware_damaged || 0} Unit Hardware</span>
              <span>•</span>
              <span>{data.summary?.material_damaged || 0}m Material</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid: Category Breakdown & Low Stock Warning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Category Breakdown */}
        <Card style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#152C4A', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📑 Sebaran Inventaris per Kategori</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.by_category && data.by_category.length > 0 ? (
              data.by_category.map((cat, index) => {
                const isConsumable = cat.name.toLowerCase().includes('kabel') || cat.name.toLowerCase().includes('fo') || cat.name.toLowerCase().includes('consumable');
                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{isConsumable ? '🧵' : '📡'}</span>
                      <span style={{ fontWeight: 700, color: '#152C4A', fontSize: '0.875rem' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: isConsumable ? '#16A34A' : '#42A1D3', fontSize: '0.875rem', backgroundColor: isConsumable ? '#DCFCE7' : '#EFF8FC', padding: '4px 12px', borderRadius: '99px' }}>
                      {cat.count} {isConsumable ? 'Meter' : 'Unit'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94A3B8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Belum ada data kategori inventaris</div>
            )}
          </div>
        </Card>

        {/* Low Stock Warnings */}
        <Card style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#152C4A', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#D97706" />
            <span>Peringatan Stok Menipis (Limit Minim)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.low_stock && data.low_stock.length > 0 ? (
              data.low_stock.map((item, index) => {
                const isConsumable = item.category?.toLowerCase().includes('kabel') || item.category?.toLowerCase().includes('fo');
                const unitText = isConsumable ? 'Meter' : 'Unit';
                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', backgroundColor: '#FEF3C7', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#78350F', fontSize: '0.875rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 500 }}>Min. Safety Limit: {item.min_stock} {unitText}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309' }}>{item.total_stock} {unitText}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: '#16A34A', gap: '0.5rem' }}>
                <CheckCircle size={32} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Semua stok barang dalam kondisi AMAN!</span>
              </div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
};
