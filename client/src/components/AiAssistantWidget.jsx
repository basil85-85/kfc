import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMessageSquare, 
  FiX, 
  FiSend, 
  FiCalendar, 
  FiUsers, 
  FiAward, 
  FiHelpCircle,
  FiChevronRight,
  FiMove,
  FiRotateCcw,
  FiSmile
} from 'react-icons/fi';

const QUICK_PROMPTS = [
  { label: "🗓️ See what's coming up", path: '/fixtures', query: "What's coming up this week on the match schedule?" },
  { label: "🙋 How do I join?", path: '/register', query: "How do I join the crew and sign up?" },
  { label: "👀 Just looking around", path: '/squad', query: "Tell me more about the club vibe and squad highlights!" }
];

const INITIAL_WELCOME = {
  id: 'welcome-1',
  sender: 'bot',
  text: "Heyyy, welcome! 🎉 You just found KFC Football Club — home of non-stop pitch action, FIFA stat cards, and matchday energy! Wanna see what we're up to this week, find out how to join the crew, or just poke around first?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('kickbot_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [messages, setMessages] = useState([INITIAL_WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Draggable position state (defaults to bottom right)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('kickbot_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return { 
      x: typeof window !== 'undefined' ? window.innerWidth - 210 : 300, 
      y: typeof window !== 'undefined' ? window.innerHeight - 80 : 500 
    };
  });

  const [isDraggingBtn, setIsDraggingBtn] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDraggingBtn(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDraggingBtn(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingBtn) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 200, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!isDraggingBtn || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 200, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      if (isDraggingBtn) {
        setIsDraggingBtn(false);
        try {
          localStorage.setItem('kickbot_btn_pos', JSON.stringify(position));
        } catch (e) {}
      }
    };

    if (isDraggingBtn) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingBtn, position]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem('kickbot_dismissed', 'true');
    } catch (err) {}
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem('kickbot_dismissed');
    } catch (err) {}
  };

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "";
      let actionLink = null;

      const lower = query.toLowerCase();

      if (lower.includes('fixture') || lower.includes('up') || lower.includes('match') || lower.includes('schedule') || lower.includes('game') || lower.includes('week')) {
        replyText = "We've got some absolute classic matches coming up! ⚽ Check out kick-off times, team match-ups, and pitch locations right here:";
        actionLink = { label: '🗓️ See Match Fixtures', path: '/fixtures' };
      } else if (lower.includes('join') || lower.includes('sign up') || lower.includes('register') || lower.includes('crew') || lower.includes('member')) {
        replyText = "We'd love to have you on board! 🙌 You can register as a solo player or sign up an entire team in just 2 minutes:";
        actionLink = { label: '🙋 Join KFC Club', path: '/register' };
      } else if (lower.includes('look') || lower.includes('squad') || lower.includes('around') || lower.includes('vibe') || lower.includes('player') || lower.includes('stat')) {
        replyText = "Awesome! Take your time exploring our player squad cards, league leaderboards, and match photo highlights! ✨";
        actionLink = { label: '👀 Explore Squad Cards', path: '/squad' };
      } else if (lower.includes('session') || lower.includes('train')) {
        replyText = "Our training sessions are high energy and super welcoming. Check out session dates and reserve your slot!";
        actionLink = { label: '📋 View Sessions', path: '/sessions' };
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        replyText = "Hey there! Happy to have you here! Let me know what you'd like to check out first — matches, squad rosters, or joining!";
      } else {
        replyText = "Ha, way outside my club duties 😄 — but ask me anything about KFC Football Club, match schedules, squad cards, or joining the crew!";
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText,
        actionLink,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  // If user dismissed floating button completely
  if (isDismissed && !isOpen) {
    return (
      <div className="fixed bottom-3 right-3 z-40">
        <button
          onClick={handleRestore}
          className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-cyan-400 backdrop-blur-md hover:bg-slate-900 transition shadow-lg"
          title="Restore KickBot Welcome Buddy"
        >
          <FiRotateCcw className="h-3 w-3" />
          <span>Show KickBot</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Draggable Trigger Floating Action Button */}
      {!isOpen && (
        <div 
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className="fixed z-50 flex items-center gap-1.5 select-none touch-none"
        >
          {/* Draggable Main Button */}
          <div
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <button
              onClick={() => {
                if (!hasMovedRef.current) {
                  setIsOpen(true);
                }
              }}
              className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-cyan-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="Open KickBot Welcome Buddy (Drag to reposition)"
              title="Drag to reposition KickBot anywhere"
            >
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-cyan-200"></span>
              </span>
              <FiSmile className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12" />
              <span className="hidden sm:inline">KickBot</span>
              <FiMove className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
            </button>
          </div>

          {/* Close/Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/90 text-slate-400 border border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-md transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
            title="Dismiss KickBot floating button"
            aria-label="Dismiss Assistant button"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Chat Assistant Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 sm:w-96 flex flex-col overflow-hidden h-[540px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-slate-950 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                <FiSmile className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">KickBot</h3>
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                    Welcome Buddy
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">KFC Football Club</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              aria-label="Close Assistant"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>

                  {msg.actionLink && (
                    <button
                      onClick={() => {
                        navigate(msg.actionLink.path);
                        setIsOpen(false);
                      }}
                      className="mt-3 flex items-center gap-1.5 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                    >
                      <span>{msg.actionLink.label}</span>
                      <FiChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-white/10 text-cyan-400">
                  <FiSmile className="h-4 w-4 animate-spin" />
                </div>
                <span className="italic">KickBot is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 border-t border-white/5 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.query)}
                className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-white/10 bg-slate-950 p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask KickBot anything..."
              className="flex-1 rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
