import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Send, Bot, User, Clock, Power, CheckCircle2, 
  ChevronLeft, Brain, X, Save, Search, Filter, RefreshCw, 
  Sparkles, MessageCircle, Info, Trash2 
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const PesanPelanggan = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('Semua'); // 'Semua' | 'BelumDibaca' | 'AiActive' | 'ManualAdmin'

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [teachingModal, setTeachingModal] = useState({ isOpen: false, question: '', answer: '' });
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useDocumentTitle('Pesan Pelanggan & CS AI — FiberPulse');

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000); // Polling for new conversations
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat && activeChat.id) {
      setIsAutoScrollEnabled(true);
      fetchMessages(activeChat.id);
      const interval = setInterval(() => fetchMessages(activeChat.id, true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat?.id]);

  useEffect(() => {
    if (Array.isArray(messages) && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 50;
    setIsAutoScrollEnabled(!isScrolledUp);
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = (force = false) => {
    if (force || isAutoScrollEnabled) {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        // Safe catch
      }
    }
  };

  const handleManualScrollToBottom = () => {
    setIsAutoScrollEnabled(true);
    scrollToBottom(true);
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConversations(data);
        } else if (data && Array.isArray(data.data)) {
          setConversations(data.data);
        } else {
          setConversations([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (id, isPolling = false) => {
    if (!isPolling) setLoadingMessages(true);
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const msgList = Array.isArray(data.messages) ? data.messages : (Array.isArray(data.data?.messages) ? data.data.messages : []);
          setMessages(msgList);

          const conv = data.conversation || data.data?.conversation || null;
          if (conv) {
            setActiveChat(conv);
          }

          setConversations(prev => {
            if (!Array.isArray(prev)) return [];
            return prev.map(c => (c && c.id === id) ? { ...c, unread_count: 0 } : c);
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !activeChat.id) return;

    const messageText = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats/${activeChat.id}/send`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText })
      });
      
      if (res.ok) {
        fetchMessages(activeChat.id);
        fetchConversations();
      } else {
        toast.error('Gagal mengirim pesan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSending(false);
    }
  };

  const handleToggleAi = async (isPaused) => {
    if (!activeChat || !activeChat.id) return;
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats/${activeChat.id}/toggle-ai`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_paused: isPaused })
      });
      
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation || data.data?.conversation;
        if (conv) {
          setActiveChat(conv);
        }
        toast.success(isPaused ? 'AI dinonaktifkan untuk percakapan ini' : 'AI diaktifkan kembali untuk percakapan ini');
        fetchConversations();
      }
    } catch (error) {
      toast.error('Gagal mengubah status AI');
    }
  };

  const handleTakeoverAllAi = async () => {
    if (!window.confirm('Yakin ingin mengaktifkan / Takeover seluruh kontak percakapan oleh AI CS?')) return;
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats/takeover-all-ai`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success('Seluruh kontak berhasil di-takeover oleh AI CS!');
        fetchConversations();
        if (activeChat?.id) {
          fetchMessages(activeChat.id);
        }
      } else {
        toast.error('Gagal mengubah status kontak');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleClearAllChats = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA RIWAYAT CHAT & percakapan WhatsApp yang ada? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/chats/clear-all`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        toast.success('Seluruh riwayat chat berhasil dihapus bersih!');
        setActiveChat(null);
        setMessages([]);
        setConversations([]);
        fetchConversations();
      } else {
        toast.error('Gagal menghapus riwayat chat');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleOpenTeachModal = (msgIndex) => {
    let questionText = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i]?.sender_type === 'customer') {
        questionText = messages[i].message;
        break;
      }
    }
    const answerText = messages[msgIndex]?.message || '';
    setTeachingModal({
      isOpen: true,
      question: questionText,
      answer: answerText
    });
  };

  const submitTeachAi = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('sanctum_token');
      const res = await fetch(`${API_URL}/ai-training`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: teachingModal.question,
          answer: teachingModal.answer
        })
      });
      if (res.ok) {
        toast.success('Pengetahuan berhasil dipelajari oleh CS AI!');
        setTeachingModal({ isOpen: false, question: '', answer: '' });
      } else {
        toast.error('Gagal menyimpan ke basis pengetahuan AI');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const isAiActive = (aiPausedUntil) => {
    if (!aiPausedUntil) return true;
    return new Date(aiPausedUntil) <= new Date();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    return conversations.filter(chat => {
      if (!chat) return false;
      const q = (searchQuery || '').toLowerCase();
      const name = (chat.customer_name || '').toLowerCase();
      const phone = (chat.phone_number || '').toLowerCase();
      const matchesSearch = !q ? true : (name.includes(q) || phone.includes(q));

      const aiActive = isAiActive(chat.ai_paused_until);
      const isUnread = Number(chat.unread_count || 0) > 0;

      let matchesTab = true;
      if (filterTab === 'BelumDibaca') matchesTab = isUnread;
      if (filterTab === 'AiActive') matchesTab = aiActive;
      if (filterTab === 'ManualAdmin') matchesTab = !aiActive;

      return matchesSearch && matchesTab;
    });
  }, [conversations, searchQuery, filterTab]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Hero Operations Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
            Pesan Pelanggan & WhatsApp CS
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '3px 0 0 0', fontWeight: 500 }}>
            Monitoring interaksi live WhatsApp pelanggan, integrasi auto-reply AI, dan takeover customer service.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleTakeoverAllAi}
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(16, 185, 129, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            <Bot size={15} color="#059669" />
            <span>Aktifkan Semua AI</span>
          </button>

          <button 
            onClick={handleClearAllChats}
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            <Trash2 size={14} color="#DC2626" />
            <span>Hapus Semua Chat</span>
          </button>

          <button 
            onClick={fetchConversations} 
            disabled={loadingChats}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={loadingChats ? 'animate-spin' : ''} color="#64748B" />
            <span>Refresh Live</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Chat Layout */}
      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 220px)', minHeight: '600px' }}>
        
        {/* Left Panel: Contact List */}
        <div style={{
          width: '340px', minWidth: '300px', backgroundColor: '#FFFFFF',
          borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          
          {/* Search & Filter Toolbar */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.6rem', backgroundColor: '#FFFFFF' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Cari kontak WhatsApp..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.4rem 0.6rem 0.4rem 2rem', borderRadius: '8px',
                  border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: 500,
                  color: '#152C4A', outline: 'none', background: 'white', boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <X size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'Semua', label: 'Semua' },
                { id: 'BelumDibaca', label: 'Unread' },
                { id: 'AiActive', label: 'AI Active' },
                { id: 'ManualAdmin', label: 'Manual' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilterTab(t.id)}
                  style={{
                    padding: '3px 8px', borderRadius: '6px', border: 'none',
                    backgroundColor: filterTab === t.id ? '#2563EB' : '#F1F5F9',
                    color: filterTab === t.id ? 'white' : '#475569',
                    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingChats && conversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontWeight: 500, fontSize: '0.75rem' }}>
                Memuat obrolan WhatsApp...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontWeight: 500, fontSize: '0.75rem' }}>
                {searchQuery ? `Tidak ada obrolan cocok "${searchQuery}"` : 'Belum ada obrolan terdaftar.'}
              </div>
            ) : (
              filteredConversations.map(chat => {
                const isActive = activeChat?.id === chat.id;
                const aiStatus = isAiActive(chat.ai_paused_until);
                const displayName = chat.customer_name || chat.phone_number || 'Pelanggan';
                const lastMsg = (Array.isArray(chat.messages) && chat.messages[0]) ? chat.messages[0].message : 'Pesan obrolan baru';

                return (
                  <div 
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    style={{ 
                      padding: '0.75rem 1rem', 
                      borderBottom: '1px solid #F1F5F9', 
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Avatar with Initials */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: isActive ? 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)' : '#F1F7FC',
                      color: isActive ? '#FFFFFF' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                    }}>
                      {getInitials(displayName)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#152C4A', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
                          {formatTime(chat.last_message_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.725rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg}
                        </span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {aiStatus ? (
                            <span style={{ fontSize: '0.6rem', backgroundColor: '#ECFDF5', color: '#059669', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                              AI
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.6rem', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, border: '1px solid #FECACA' }}>
                              MANUAL
                            </span>
                          )}

                          {Number(chat.unread_count || 0) > 0 && (
                            <span style={{ background: '#DC2626', color: 'white', borderRadius: '99px', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 800 }}>
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel: Active Chat Area */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF',
          borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          {activeChat ? (
            <>
              {/* Active Chat Top Header */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#FFFFFF', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem'
                  }}>
                    {getInitials(activeChat.customer_name || activeChat.phone_number)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#152C4A', margin: 0 }}>
                      {activeChat.customer_name || activeChat.phone_number || 'Pelanggan'}
                    </h3>
                    <a 
                      href={`https://wa.me/62${String(activeChat.phone_number || '').replace(/^0/, '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}
                    >
                      <MessageCircle size={12} color="#10B981" /> {activeChat.phone_number || 'WhatsApp Direct'} (Buka WhatsApp Web)
                    </a>
                  </div>
                </div>
                
                {/* AI Toggle Status Pill Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAiActive(activeChat.ai_paused_until) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <Bot size={14} color="#059669" />
                      <div>
                        <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#059669' }}>CS AI AUTO-REPLY AKTIF</span>
                        <span style={{ fontSize: '0.6rem', color: '#047857', fontWeight: 500 }}>Otomatis membalas pertanyaan</span>
                      </div>
                      <button 
                        onClick={() => handleToggleAi(true)} 
                        style={{ marginLeft: '6px', padding: '4px 8px', background: 'white', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}
                      >
                        Matikan AI (Takeover Admin)
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FEF2F2', padding: '4px 10px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                      <Power size={14} color="#DC2626" />
                      <div>
                        <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#DC2626' }}>MODE MANUAL (AI SLEEP)</span>
                        <span style={{ fontSize: '0.6rem', color: '#B91C1C', fontWeight: 500 }}>
                          Pause s/d {activeChat.ai_paused_until ? formatTime(activeChat.ai_paused_until) : 'Manual'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleToggleAi(false)} 
                        style={{ marginLeft: '6px', padding: '4px 8px', background: 'white', border: '1px solid #A7F3D0', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, color: '#059669', cursor: 'pointer' }}
                      >
                        Aktifkan AI Kembali
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Message Bubble Stream */}
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative' }}
              >
                {loadingMessages && safeMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748B', fontWeight: 500, padding: '2rem', fontSize: '0.75rem' }}>
                    Memuat riwayat obrolan pelanggan...
                  </div>
                ) : safeMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 500, padding: '2rem', fontSize: '0.75rem' }}>
                    Belum ada riwayat pesan dalam obrolan ini.
                  </div>
                ) : (
                  safeMessages.map((msg, idx) => {
                    const isMe = msg.sender_type !== 'customer';
                    const prevMsg = safeMessages[idx - 1];
                    const showDate = idx === 0 || (prevMsg && formatDate(msg.created_at) !== formatDate(prevMsg.created_at));
                    
                    return (
                      <React.Fragment key={msg.id || idx}>
                        {showDate && (
                          <div style={{ textAlign: 'center', margin: '0.75rem 0' }}>
                            <span style={{ background: '#E2E8F0', padding: '3px 12px', borderRadius: '99px', fontSize: '0.65rem', color: '#475569', fontWeight: 700, fontFamily: 'monospace' }}>
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          {isMe && msg.sender_type === 'ai' && (
                            <span style={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Bot size={11} /> Dibalas oleh CS AI
                            </span>
                          )}
                          {isMe && msg.sender_type === 'admin' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <button 
                                onClick={() => handleOpenTeachModal(idx)} 
                                style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#7E22CE', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: 700 }}
                                title="Klik untuk mengajari AI dari respon ini"
                              >
                                <Brain size={10} /> Ajari AI
                              </button>
                              <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <User size={10} /> Dibalas oleh Admin
                              </span>
                            </div>
                          )}
                          
                          <div style={{ 
                            maxWidth: '75%', 
                            padding: '10px 14px', 
                            background: isMe ? (msg.sender_type === 'ai' ? '#EFF6FF' : '#ECFDF5') : '#FFFFFF', 
                            color: '#152C4A', 
                            borderRadius: '12px', 
                            borderBottomRightRadius: isMe ? '2px' : '12px',
                            borderBottomLeftRadius: isMe ? '12px' : '2px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            border: `1px solid ${isMe ? (msg.sender_type === 'ai' ? '#BFDBFE' : '#A7F3D0') : '#E2E8F0'}`,
                            fontSize: '0.8rem',
                            lineHeight: '1.45',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontWeight: 500
                          }}>
                            {msg.message || ''}
                          </div>
                          
                          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'monospace' }}>
                            {formatTime(msg.created_at)}
                            {isMe && msg.status === 'sent' && <CheckCircle2 size={11} color="#10B981" />}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <div style={{ position: 'absolute', bottom: '80px', right: '30px', zIndex: 10 }}>
                  <button 
                    onClick={handleManualScrollToBottom}
                    style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: '99px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                  >
                    Ada Pesan Baru
                  </button>
                </div>
              )}

              {/* Chat Reply Form */}
              <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #E2E8F0', background: 'white' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Ketik pesan balasan untuk pelanggan ini..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                      flex: 1, padding: '9px 14px', border: '1px solid #CBD5E1', borderRadius: '8px',
                      outline: 'none', fontSize: '0.8rem', fontWeight: 500, color: '#152C4A'
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !newMessage.trim()}
                    className="sgt-btn-primary"
                    style={{
                      borderRadius: '8px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px',
                      fontWeight: 700, fontSize: '0.8rem', cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !newMessage.trim() ? 0.6 : 1, border: 'none'
                    }}
                  >
                    <Send size={14} /> Kirim
                  </button>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', justifyContent: 'center' }}>
                  <Info size={12} color="#64748B" />
                  <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
                    Membalas pesan secara manual akan otomatis mengistirahatkan CS AI sementara agar obrolan berjalan personal.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', padding: '3rem' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <MessageSquare size={26} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#152C4A', margin: '0 0 4px 0' }}>Pilih Percakapan Pelanggan</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, textAlign: 'center', maxWidth: '340px' }}>
                Klik salah satu obrolan di panel sebelah kiri untuk melihat histori percakapan & mengelola CS AI.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Teach AI Modal */}
      {teachingModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#152C4A', fontWeight: 800, fontSize: '1rem' }}>
                <Brain size={18} color="#8B5CF6" /> Ajarkan ke Otak CS AI
              </h3>
              <button onClick={() => setTeachingModal({isOpen: false, question:'', answer:''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
              CS AI akan otomatis mempelajari jawaban ini dan membalas secara presisi ketika ada pelanggan lain yang menanyakan hal serupa.
            </p>
            
            <form onSubmit={submitTeachAi}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>Pertanyaan Pelanggan (Konteks)</label>
                <textarea 
                  required
                  rows={2}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'inherit', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                  value={teachingModal.question}
                  onChange={(e) => setTeachingModal({...teachingModal, question: e.target.value})}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>Jawaban Anda (Aturan AI)</label>
                <textarea 
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'inherit', fontSize: '0.75rem', color: '#152C4A', boxSizing: 'border-box' }}
                  value={teachingModal.answer}
                  onChange={(e) => setTeachingModal({...teachingModal, answer: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setTeachingModal({isOpen: false, question:'', answer:''})} style={{ padding: '7px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer', fontSize: '0.75rem' }}>Batal</button>
                <button type="submit" className="sgt-btn-primary" style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                  <Save size={14} /> Simpan Pengetahuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

