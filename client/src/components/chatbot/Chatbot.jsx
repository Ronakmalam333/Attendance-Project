import React, { useState, useRef, useEffect } from "react";
import api from "../../tokenManager";
import Icons from "../ui/Icons";
import "./Chatbot.css";

const quickGuides = [
  { label: "📝 Mark Attendance", query: "How do I mark my attendance with a token?" },
  { label: "⚖️ 75% Rule", query: "What is the statutory 75% attendance rule and policy?" },
  { label: "🔑 Faculty Token", query: "How does faculty generate and manage attendance tokens?" },
  { label: "🔄 Discrepancy Fix", query: "How do I fix a missed attendance or 24h discrepancy?" },
  { label: "📁 Excel Bulk Import", query: "How can faculty bulk import students using Excel?" },
  { label: "🎫 Grievance Ticket", query: "How do I submit an attendance or academic grievance ticket?" },
  { label: "📊 Export PDF / Excel", query: "How do I export attendance records as PDF or Excel?" },
  { label: "👨‍💻 Who Built AMS?", query: "Who is the Project Originator & Lead Developer?" },
];

/**
 * Lightweight formatting parser for assistant responses
 * Converts **bold**, `code`, bullet points, and newlines into rich JSX elements
 */
const FormattedMessage = ({ text }) => {
  if (!text) return null;

  // Split text by lines
  const lines = text.split("\n");

  return (
    <div className='erp-formatted-msg'>
      {lines.map((line, lineIdx) => {
        // Line-level formatting
        const trimmed = line.trim();

        // Empty line becomes a spacer
        if (!trimmed) {
          return <div key={lineIdx} style={{ height: "6px" }} />;
        }

        // Parse inline **bold** and `code`
        const parseInline = (str) => {
          // Regex to match **bold** or `code`
          const parts = [];
          let lastIndex = 0;
          const inlineRegex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
          let match;

          while ((match = inlineRegex.exec(str)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
              parts.push(str.substring(lastIndex, match.index));
            }
            if (match[2]) {
              // **bold**
              parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
            } else if (match[3]) {
              // `code`
              parts.push(<code key={`c-${match.index}`}>{match[3]}</code>);
            }
            lastIndex = inlineRegex.lastIndex;
          }

          if (lastIndex < str.length) {
            parts.push(str.substring(lastIndex));
          }

          return parts.length > 0 ? parts : str;
        };

        // Render line with appropriate margins
        return (
          <div key={lineIdx} style={{ marginBottom: "2px" }}>
            {parseInline(line)}
          </div>
        );
      })}
    </div>
  );
};

const INITIAL_WELCOME = {
  text: "Hello! 👋 I am your **AMS Academic Assistant**.\n\nI have complete knowledge of the entire Attendance Management System platform — including token submission, the 75% attendance rule, faculty session controls, Excel bulk ingestion, grievance tickets, PDF transcripts, and developer info.\n\nHow can I help you today? You can type any question or pick a quick topic below!",
  sender: "bot",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME]);
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
  }, [messages, isOpen, isTyping]);

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: "The assistance server is momentarily unavailable. Please check your network connection or verify your server session.",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME]);
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
            <div className='erp-chatbot-header-actions'>
              <button
                type='button'
                className='erp-chatbot-icon-btn'
                onClick={handleClearChat}
                title='Clear Conversation'
                aria-label='Clear Conversation'
              >
                <Icons.RotateCcw size={15} />
              </button>
              <button
                type='button'
                className='erp-chatbot-icon-btn'
                onClick={() => setIsOpen(false)}
                title='Close Assistant'
                aria-label='Close Assistant'
              >
                <Icons.X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className='erp-chatbot-body'>
            {messages.map((msg, i) => (
              <div key={i} className={`erp-chat-msg ${msg.sender}`}>
                <div className='erp-chat-bubble'>
                  {msg.sender === "bot" ? (
                    <FormattedMessage text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
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

          {/* Quick Topic Chips Tray */}
          <div className='erp-chatbot-chips-tray'>
            {quickGuides.map((item, idx) => (
              <button
                key={idx}
                type='button'
                className='erp-chip-btn'
                onClick={() => handleSend(item.query)}
                disabled={isTyping}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <div className='erp-chatbot-footer'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder='Ask any question about AMS...'
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
          title='AMS Academic Assistant'
          aria-label='Open Academic Assistant'
        >
          <Icons.Bot size={22} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
