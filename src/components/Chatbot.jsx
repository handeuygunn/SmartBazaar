import React, { useState } from 'react';
import axios from 'axios';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import './Chatbot.css'; // Assuming we'll add styles here

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Merhaba! Ben SmartBazaar Yapay Zeka botuyum. Sana özel ürün tavsiyeleri istersen, aşağıdaki butona tıklayarak güncel önerileri alabilirsin!' }
  ]);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const fetchRecommendations = async () => {
    setLoading(true);
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: 'Bana ürün önerir misin?' }]);
    
    try {
      const response = await axios.get('http://localhost:5001/api/chat/recommend');
      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Şu an öneri sistemine bağlanamıyorum. Lütfen daha sonra tekrar dene.' }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      let errorMsg = 'Üzgünüm, API ile iletişim kurarken bir hata oluştu.';
      if (error.response && error.response.data && error.response.data.error) {
         errorMsg = `Hata: ${error.response.data.error}`;
      }
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbot-container">
      {isOpen ? (
        <div className="chatbot-window card shadow-lg border-0">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fs-6 d-flex align-items-center">
              <MessageCircle size={18} className="me-2" />
              Yapay Zeka Satış Asistanı
            </h5>
            <button className="btn-close btn-close-white" onClick={toggleChat}></button>
          </div>
          
          <div className="card-body chatbot-messages p-3" style={{ height: '350px', overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div className={`p-3 rounded-4 ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`} style={{ maxWidth: '85%', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="bg-light text-dark p-3 rounded-4 d-flex align-items-center">
                  <Loader2 className="spinner-border spinner-border-sm me-2 text-primary" size={16} /> Satış asistanı düşünüyor...
                </div>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-white border-top-0 p-3">
            <button 
              className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center" 
              onClick={fetchRecommendations} 
              disabled={loading}
              style={{ borderRadius: '25px' }}
            >
              {loading ? 'Öneriler Hesaplanıyor...' : '💡 Akıllı Ürün Önerisi Al'}
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={toggleChat} 
          className="btn btn-primary rounded-circle shadow-lg chatbot-toggle-btn d-flex align-items-center justify-content-center"
          aria-label="Satış Asistanı"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
