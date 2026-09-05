import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Brain, Plus, Trash2, Edit2, Save, X, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const AiKnowledgeBasePanel = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add State
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/knowledge-base`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaqs(data);
      } else {
        setFaqs([]);
        console.error('Expected array, got:', data);
      }
    } catch (error) {
      toast.error('Gagal memuat Knowledge Base');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/knowledge-base`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer })
      });
      if (res.ok) {
        toast.success('Pengetahuan baru ditambahkan!');
        setNewQuestion('');
        setNewAnswer('');
        setIsAdding(false);
        fetchFaqs();
      } else {
        toast.error('Gagal menyimpan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Hapus pengetahuan ini secara permanen?')) {
      try {
        const token = localStorage.getItem('sanctum_token');
        await fetch(`${API_URL}/knowledge-base/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Pengetahuan dihapus');
        fetchFaqs();
      } catch (error) {
        toast.error('Gagal menghapus');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const token = localStorage.getItem('sanctum_token');
      await fetch(`${API_URL}/knowledge-base/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: editQuestion, answer: editAnswer })
      });
      toast.success('Pengetahuan diupdate');
      setEditingId(null);
      fetchFaqs();
    } catch (error) {
      toast.error('Gagal mengupdate');
    }
  };

  const openEdit = (faq, e) => {
    e.stopPropagation();
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setExpandedId(faq.id); // Auto expand when editing
  };

  const toggleExpand = (id) => {
    if (editingId === id) return; // Prevent collapse if currently editing
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card style={{ marginBottom: '2rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0 }}>
          <Brain color="var(--primary)" size={20} /> Otak AI (Knowledge Base & FAQ)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search color="#94A3B8" size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #42A1D3 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(66, 161, 211, 0.35)' }}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />} 
            {isAdding ? 'Batal' : 'Tambah Data'}
          </button>
        </div>
      </div>

      <div className="card-content" style={{ padding: '1.25rem' }}>
        
        {/* INLINE ADD FORM */}
        {isAdding && (
          <div style={{ marginBottom: '1.5rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Plus size={18} color="#2563EB" /> Tambah Pengetahuan Baru
            </h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Pertanyaan / Topik Pembahasan</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  placeholder="Misal: Info Harga Pasang Baru"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Jawaban (Fakta Mentah)</label>
                <textarea 
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }}
                  placeholder="Paket 10Mbps (150rb), 20Mbps (200rb). Biaya pasang 100rb..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  style={{ background: 'white', color: '#152C4A', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'linear-gradient(135deg, #42A1D3 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(66, 161, 211, 0.35)' }}
                >
                  <Save size={16} /> Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
              {searchTerm ? 'Tidak ada hasil yang cocok dengan pencarian Anda.' : 'Belum ada data knowledge base. AI belum diajari apapun.'}
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isEditing = editingId === faq.id;
              const isExpanded = expandedId === faq.id || isEditing;
              
              return (
                <div 
                  key={faq.id} 
                  style={{ 
                    border: isExpanded ? '1px solid #BFDBFE' : '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    boxShadow: isExpanded ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <div 
                    onClick={() => toggleExpand(faq.id)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      cursor: isEditing ? 'default' : 'pointer',
                      backgroundColor: isExpanded ? '#EFF6FF' : '#FFFFFF',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => { if(!isEditing) e.currentTarget.style.backgroundColor = isExpanded ? '#EFF6FF' : '#F8FAFC' }}
                    onMouseOut={(e) => { if(!isEditing) e.currentTarget.style.backgroundColor = isExpanded ? '#EFF6FF' : '#FFFFFF' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, paddingRight: '16px' }}>
                      <div style={{ color: '#94A3B8', marginTop: '2px' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                      <div style={{ fontWeight: 500, color: isExpanded ? '#1E3A8A' : 'var(--text-main)', fontSize: '0.95rem' }}>
                        {faq.question}
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={(e) => openEdit(faq, e)} 
                          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(faq.id, e)} 
                          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '16px 16px 16px 46px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
                      {isEditing ? (
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Edit Pertanyaan / Topik</label>
                            <input 
                              type="text" 
                              required
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Edit Jawaban (Fakta Mentah)</label>
                            <textarea 
                              required
                              rows={5}
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }}
                              value={editAnswer}
                              onChange={(e) => setEditAnswer(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                              <Save size={14} /> Simpan Perubahan
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingId(null)}
                              className="btn btn-outline"
                              style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};

