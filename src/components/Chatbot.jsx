import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Loader2, Send, ShoppingBag, HelpCircle } from 'lucide-react';
import './Chatbot.css';

const API_BASE = 'http://localhost:5001';

// Render bold **text** and bullet lines
const renderMarkdown = (text) => {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="chat-line">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    );
  });
};

const QUICK_CHIPS = [
  { label: '🚚 Kargo süresi', message: 'Kargom ne zaman gelir?' },
  { label: '↩️ İade koşulları', message: 'Ürünü iade etmek istiyorum' },
  { label: '💳 Ödeme yöntemleri', message: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?' },
  { label: '💡 Ürün önerisi', message: '__recommend__' },
];

const WELCOME_MSG = {
  sender: 'bot',
  text:
    '👋 Merhaba! Ben SmartBazaar Destek Asistanıyım.\n\n' +
    'Kargo, iade ve ödeme konularındaki sorularınızı yanıtlayabilirim, ' +
    'ya da size özel ürün önerileri sunabilirim.\n\n' +
    'Aşağıdaki hızlı seçeneklerden birini kullanın veya sorunuzu yazın!',
  intent: 'welcome',
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('faq'); // 'faq' | 'recommend'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const addMessage = (sender, text, intent = null) =>
    setMessages((prev) => [...prev, { sender, text, intent }]);

  const sendFaq = async (userText) => {
    addMessage('user', userText);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/chat/faq`, { message: userText });
      addMessage('bot', res.data.response, res.data.intent);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Şu an yanıt veremiyorum. Lütfen daha sonra tekrar dene.';
      addMessage('bot', msg, 'error');
    }
    setLoading(false);
  };

  const sendRecommend = async () => {
    addMessage('user', 'Bana ürün önerisi yap 💡');
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/chat/recommend`);
      addMessage('bot', res.data.response || 'Öneri alınamadı.', 'recommend');
    } catch (err) {
      addMessage('bot', 'Öneri sistemi şu an meşgul. Lütfen tekrar dene.', 'error');
    }
    setLoading(false);
  };

  const handleChip = (chip) => {
    if (loading) return;
    if (chip.message === '__recommend__') {
      sendRecommend();
    } else {
      sendFaq(chip.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendFaq(text);
  };

  const intentBadge = (intent) => {
    const map = {
      shipping: { label: 'Kargo', color: '#3b82f6' },
      returns: { label: 'İade', color: '#f59e0b' },
      payment: { label: 'Ödeme', color: '#10b981' },
      recommend: { label: 'Öneri', color: '#8b5cf6' },
      greeting: null,
      welcome: null,
      unknown: { label: 'Destek', color: '#ef4444' },
      ai_assisted: { label: 'AI', color: '#6366f1' },
    };
    if (!intent || !map[intent]) return null;
    const b = map[intent];
    return (
      <span className="intent-badge" style={{ background: b.color }}>
        {b.label}
      </span>
    );
  };

  return (
    <div className="chatbot-container">
      {isOpen ? (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <MessageCircle size={18} />
              </div>
              <div>
                <div className="chatbot-title">SmartBazaar Asistan</div>
                <div className="chatbot-status">
                  <span className="status-dot" />
                  Çevrimiçi
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Kapat">
              <X size={18} />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="chatbot-tabs">
            <button
              className={`chatbot-tab ${activeMode === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveMode('faq')}
            >
              <HelpCircle size={14} /> Destek & SSS
            </button>
            <button
              className={`chatbot-tab ${activeMode === 'recommend' ? 'active' : ''}`}
              onClick={() => { setActiveMode('recommend'); if (!loading) sendRecommend(); }}
            >
              <ShoppingBag size={14} /> Ürün Önerisi
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" id="chatbot-messages-area">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="bot-avatar-small">🤖</div>
                )}
                <div className={`chat-bubble ${msg.sender}`}>
                  {intentBadge(msg.intent)}
                  <div className="chat-text">{renderMarkdown(msg.text)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-row bot">
                <div className="bot-avatar-small">🤖</div>
                <div className="chat-bubble bot typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div className="chatbot-chips">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                className="chip"
                onClick={() => handleChip(chip)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form className="chatbot-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              id="chatbot-input"
              className="chatbot-input"
              type="text"
              placeholder="Sorunuzu yazın…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <button
              id="chatbot-send-btn"
              type="submit"
              className="chatbot-send"
              disabled={loading || !input.trim()}
              aria-label="Gönder"
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : (
        <button
          id="chatbot-toggle-btn"
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Destek Asistanını Aç"
        >
          <MessageCircle size={28} />
          <span className="chatbot-toggle-badge">?</span>
        </button>
      )}
    </div>
  );
}
