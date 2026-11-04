import React, { useState, useRef, useEffect } from "react";
import api from "../../tokenManager";
import Icons from "../ui/Icons";
import "./Chatbot.css";

const quickPrompts = [
  "How do I mark my attendance with a token?",
  "What is the minimum attendance requirement?",
  "How are late attendances calculated?",
  "Who do I contact for attendance discrepancy?",
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I am your AMS Academic Assistant. You can ask me about class attendance, session tokens, academic policies, or timetables.",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      text: textToSend.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.post("/chatbot", { prompt: textToSend.trim() });
      const botResponse = res.data.response || "I could not retrieve an answer for that inquiry. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          text: botResponse,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "The assistance server is momentarily unavailable. Please check your connection or contact the campus administrator.",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className='erp-chatbot-widget'>
      {isOpen ? (
        <div className='erp-chatbot-window erp-card' role='dialog' aria-label='AI Academic Assistant'>
          {/* Header */}
          <div className='erp-chatbot-header'>
            <div className='erp-chatbot-identity'>
              <div className='erp-chatbot-avatar'>
                <Icons.Bot size={18} />
              </div>
              <div className='erp-chatbot-title-block'>
                <span className='erp-chatbot-title'>AMS Academic Assistant</span>
                <span className='erp-chatbot-status'>
                  <span className='erp-status-dot' /> Online • AI Telemetry
                </span>
              </div>
            </div>
            <button
              type='button'
              className='erp-chatbot-close-btn'
              onClick={() => setIsOpen(false)}
              aria-label='Close Assistant'
            >
              <Icons.X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div className='erp-chatbot-body'>
            {messages.map((msg, i) => (
              <div key={i} className={`erp-chat-msg ${msg.sender}`}>
                <div className='erp-chat-bubble'>{msg.text}</div>
                <span className='erp-chat-time tabular-nums'>{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className='erp-chat-msg bot'>
                <div className='erp-chat-bubble erp-typing-indicator'>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 3 && (
            <div className='erp-chatbot-chips'>
              {quickPrompts.slice(0, 2).map((chip, idx) => (
                <button
                  key={idx}
                  type='button'
                  className='erp-chip-btn'
                  onClick={() => handleSend(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className='erp-chatbot-footer'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder='Type academic question...'
              className='erp-chat-input'
              disabled={isTyping}
            />
            <button
              type='button'
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className='erp-chat-send-btn'
              aria-label='Send message'
            >
              <Icons.ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          className='erp-chatbot-trigger'
          onClick={() => setIsOpen(true)}
          title='Academic Assistant'
          aria-label='Open Academic Assistant'
        >
          <Icons.Bot size={22} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
