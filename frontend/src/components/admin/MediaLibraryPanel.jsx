import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Image as ImageIcon, Upload, Trash2, Copy, RefreshCw, Eye, Edit3, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const MediaLibraryPanel = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/media-files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMedia(data);
      } else {
        setMedia([]);
      }
    } catch (error) {
      toast.error('Gagal memuat galeri media');
    } finally {
      setLoading(false);
    }
  };

  // Grouping media by base filename so backup extensions (.jpg, .png, .svg) appear as ONLY 1 Item in UI
  const groupedMedia = useMemo(() => {
    const map = new Map();
    media.forEach((item) => {
      if (!item || !item.name) return;
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      if (!map.has(baseName)) {
        map.set(baseName, {
          baseName,
          primaryName: item.name,
          url: item.url,
          created_at: item.created_at,
          variations: [item]
        });
      } else {
        const existing = map.get(baseName);
        existing.variations.push(item);
        // Prefer png or jpg over svg for thumbnail preview if available
        if (item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg')) {
          existing.url = item.url;
          existing.primaryName = item.name;
        }
      }
    });
    return Array.from(map.values());
  }, [media]);

  const handleUpload = async (e, replaceBaseName = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (replaceBaseName) {
      formData.append('replace_name', replaceBaseName);
    }

    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/media-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast.success(replaceBaseName ? 'Gambar berhasil diperbarui & diganti!' : 'Gambar berhasil diupload!');
        setEditingItem(null);
        fetchMedia();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal upload gambar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (window.confirm(`Hapus gambar "${group.baseName}" beserta seluruh format cadangannya?`)) {
      try {
        const token = localStorage.getItem('sanctum_token');
        await fetch(`${API_URL}/media-files/${group.primaryName}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Gambar & format cadangannya berhasil dihapus!');
        fetchMedia();
      } catch (error) {
        toast.error('Gagal menghapus gambar');
      }
    }
  };

  const handleCopyCode = (filename) => {
    const code = `[GAMBAR: ${filename}]`;
    navigator.clipboard.writeText(code);
    toast.success(`Kode AI '${code}' berhasil disalin!`);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Card style={{ marginBottom: '2rem', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(21, 44, 74, 0.04)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              <ImageIcon size={20} color="#0284c7" /> Galeri Media CS AI
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
              Kelola gambar brosur, promosi &amp; lampiran media WhatsApp AI (1 Tampilan Bersih + Scroll Samping)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {groupedMedia.length > 3 && (
              <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                <button
                  onClick={scrollLeft}
                  style={{
                    backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px',
                    width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#334155'
                  }}
                  title="Scroll Kiri"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollRight}
                  style={{
                    backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px',
                    width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#334155'
                  }}
                  title="Scroll Kanan"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <input 
              type="file" 
              id="media-upload-main" 
              accept="image/*" 
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e)}
              disabled={uploading}
            />
            <label 
              htmlFor="media-upload-main"
              style={{ 
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', 
                color: 'white', border: 'none', borderRadius: '10px', 
                fontSize: '0.85rem', padding: '0.6rem 1.25rem', 
                cursor: uploading ? 'not-allowed' : 'pointer', 
                display: 'inline-flex', alignItems: 'center', gap: '6px', 
                fontWeight: 800, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />} 
              {uploading ? 'Mengupload...' : '+ Upload Gambar Baru'}
            </label>
          </div>
        </div>

        <div className="card-content" style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" />
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>Memuat Galeri Media...</p>
            </div>
          ) : groupedMedia.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <ImageIcon size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', margin: 0 }}>Belum ada media brosur yang di-upload</p>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0 0' }}>Tekan tombol "+ Upload Gambar Baru" di kanan atas untuk menambahkan foto brosur</p>
            </div>
          ) : (
            /* Horizontal Scrollable Carousel Container */
            <div 
              ref={scrollContainerRef}
              style={{
                display: 'flex', gap: '1.15rem', overflowX: 'auto', paddingBottom: '0.75rem',
                scrollSnapType: 'x mandatory', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {groupedMedia.map((group) => (
                <div 
                  key={group.baseName} 
                  style={{ 
                    flex: '0 0 230px', scrollSnapAlign: 'start',
                    border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', 
                    display: 'flex', flexDirection: 'column', background: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)', transition: 'all 0.2s'
                  }}
                >
                  {/* Image Thumbnail Container */}
                  <div style={{ height: '150px', background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={group.url} 
                      alt={group.baseName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/230x150?text=Format+Media' }}
                    />

                    {/* View Button Overlay */}
                    <button
                      onClick={() => setLightboxUrl(group.url)}
                      style={{
                        position: 'absolute', top: '8px', left: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backdropFilter: 'blur(4px)'
                      }}
                      title="Lihat Gambar Resolusi Penuh"
                    >
                      <Eye size={13} /> View
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      style={{ 
                        position: 'absolute', top: '8px', right: '8px', 
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', 
                        borderRadius: '8px', padding: '5px', cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                      title="Hapus Gambar & Cadangan"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Single Display Badge */}
                    <div style={{
                      position: 'absolute', bottom: '6px', left: '8px',
                      backgroundColor: '#0284c7', color: 'white', fontSize: '9px', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.04em'
                    }}>
                      ✓ 1 Tampilan Utama ({group.variations.length} format)
                    </div>
                  </div>

                  {/* Card Content & Action Bar */}
                  <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    <div style={{ fontSize: '0.825rem', color: '#0F172A', fontWeight: 700, wordBreak: 'break-all', lineHeight: 1.3 }}>
                      {group.baseName}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label
                        style={{
                          flex: 1, backgroundColor: '#F0F9FF', color: '#0284c7', border: '1px solid #BAE6FD',
                          borderRadius: '8px', padding: '5px 8px', fontSize: '0.725rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
                        }}
                        title="Ganti Gambar"
                      >
                        <Edit3 size={12} /> Ganti File
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => handleUpload(e, group.baseName)}
                          disabled={uploading}
                        />
                      </label>

                      <button
                        onClick={() => handleCopyCode(group.primaryName)}
                        style={{
                          flex: 1, backgroundColor: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1',
                          borderRadius: '8px', padding: '5px 8px', fontSize: '0.725rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
                        }}
                        title="Salin Kode AI untuk dimasukkan ke balasan"
                      >
                        <Copy size={12} /> Salin Kode
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Lightbox Fullscreen Preview Modal */}
      {lightboxUrl && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxUrl} 
              alt="Preview Media AI" 
              style={{ width: '100%', height: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                backgroundColor: '#ef4444', color: 'white', border: '2px solid white',
                borderRadius: '50%', width: '34px', height: '34px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 10
              }}
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

