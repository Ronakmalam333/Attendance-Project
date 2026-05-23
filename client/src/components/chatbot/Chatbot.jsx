import React, { useState } from 'react';
import api from '../../tokenManager';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Luna. Made by MayaMatrix How Can I Help You Today, Ask me anything!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const res = await api.post('/chatbot', { prompt: input });
      const botResponse = res.data.response || "Sorry, I couldn't understand that.";
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      console.error('Chatbot Error:', error);
      setMessages(prev => [...prev, { text: "Error fetching response from server.", sender: 'bot' }]);
    }
  };

  return (
    <div className="chatbot-widget">
      {isOpen ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>🤖 Maya </span>
            <button className="chatbot-close" onClick={closeChat} aria-label="Close">&times;</button>
          </div>
          <div className="chatbot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.sender}`}>{msg.text}</div>
            ))}
          </div>
          <div className="chatbot-footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <button className="chatbot-toggle" onClick={openChat} title="Ask Assistant" aria-label="Open chat">
          💬
        </button>
      )}
    </div>
  );
};

export default Chatbot;