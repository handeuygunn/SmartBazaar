import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { sendChatMessage } from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hi! I'm your AI shopping assistant. How can I help you today?", isBot: true }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(userMsg);
      setMessages(prev => [...prev, { text: response.text, isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        className={`btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center p-3 ${isOpen ? 'd-none' : ''}`}
        style={{ bottom: '30px', right: '30px', width: '60px', height: '60px', zIndex: 1000 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={28} />
      </button>

      {isOpen && (
        <div className="card shadow-lg position-fixed border-0 d-flex flex-column" 
             style={{ bottom: '30px', right: '30px', width: '350px', height: '500px', zIndex: 1050, borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* Header */}
          <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <MessageSquare size={20} />
              <span className="fw-semibold">AI Assistant</span>
            </div>
            <button className="btn btn-sm text-white border-0" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="card-body p-3 overflow-auto bg-light flex-grow-1" style={{ borderBottom: '1px solid #dee2e6' }}>
            <div className="d-flex flex-column gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`d-flex ${msg.isBot ? 'justify-content-start' : 'justify-content-end'}`}>
                  <div className={`p-2 px-3 rounded-4 ${msg.isBot ? 'bg-white border' : 'bg-primary text-white'}`} style={{ maxWidth: '85%', fontSize: '0.9rem' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="d-flex justify-content-start">
                  <div className="p-2 px-3 bg-white border rounded-4 text-muted small">
                    typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white">
            <form onSubmit={handleSend} className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control rounded-pill border-0 bg-light px-3" 
                placeholder="Ask me anything..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px', minWidth: '40px' }}
                disabled={isTyping || !input.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
