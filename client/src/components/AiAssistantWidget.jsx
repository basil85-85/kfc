import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import api from '../services/api';
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
  FiSmile,
  FiZap
} from 'react-icons/fi';

export default function AiAssistantWidget() {
  const { user } = useContext(AuthContext);
  const { setIsChatOpen } = useContext(ChatContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('kickbot_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Onboarding conversation state for non-logged-in users
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userName, setUserName] = useState('');

  // Initial welcome message depending on auth state
  const initialMsgText = user
    ? `Heyyy ${user.name?.split(' ')[0] || 'Player'}! ⚽ Good to see you back on the pitch! Ask me anything about live match schedules, top player ratings, standings, or session signups!`
    : "Heyyy, welcome! 🎉 You just found KFC Football Club — home of non-stop pitch action, FIFA stat cards, and matchday energy! Want to see what we're up to this week, join the crew in 30 seconds, or just poke around first?";

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: initialMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick prompts depending on auth state
  const quickPrompts = user
    ? [
        { label: "🗓️ Next Match", query: "When is our next match schedule?" },
        { label: "⭐ Top Player Rating", query: "Who is the top rated player in the squad?" },
        { label: "📋 Training Sessions", query: "Are there any training sessions coming up?" },
        { label: "🏆 League Table", query: "Show me the league standings table" }
      ]
    : [
        { label: "🗓️ See what's coming up", query: "What's coming up this week on the match schedule?" },
        { label: "✨ Join the club — takes 30 seconds", query: "I want to join the crew!" },
        { label: "👀 Just looking around first", query: "Tell me more about the club vibe and squad highlights!" }
      ];

  // Position state (draggable)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('kickbot_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
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

  const handleSend = async (textToSend) => {
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

    // Handle conversational onboarding steps if user is not logged in
    if (!user && onboardingStep === 1) {
      setUserName(query.trim());
      setOnboardingStep(2);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Great to meet you, ${query.trim()}! 🎉 Are you looking to play on the pitch (Striker, Midfielder, Defender, Keeper) or join as a manager/fan?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 500);
      return;
    }

    if (!user && onboardingStep === 2) {
      setOnboardingStep(3);
      const namePart = userName ? `, ${userName}` : '';
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Awesome${namePart}! You'll fit right in with the crew ⚽ We have custom FIFA stat cards and matchday lineup slots built for players like you. Let's get your profile set up — takes less than 30 seconds:`,
          actionLink: { label: '✨ Create Player Account', path: '/register' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 500);
      return;
    }

    // Call intelligent backend AI API endpoint
    try {
      const { data } = await api.post('/ai/ask', { question: query });
      if (data?.replyText) {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.replyText,
          actionLink: data.actionLink,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }
    } catch (err) {
      // Fallback if backend API call fails or server is restarting
    }

    // Local intelligence fallback
    setTimeout(() => {
      let replyText = "";
      let actionLink = null;
      const lower = query.toLowerCase();

      if (lower.includes('join') || lower.includes('sign up') || lower.includes('register') || lower.includes('crew')) {
        if (user) {
          replyText = `You're already an official club member, ${user.name}! You can check session signups or profile anytime.`;
          actionLink = { label: '📋 View Sessions', path: '/sessions' };
        } else {
          setOnboardingStep(1);
          replyText = "Awesome! We'd love to have you on board! 🎉 First, what should I call you?";
        }
      } else if (lower.includes('fixture') || lower.includes('match') || lower.includes('schedule') || lower.includes('game')) {
        replyText = "We've got some absolute classic matches coming up! ⚽ Check out kick-off times, team match-ups, and pitch locations right here:";
        actionLink = { label: '🗓️ See Match Fixtures', path: '/fixtures' };
      } else if (lower.includes('squad') || lower.includes('player') || lower.includes('rating') || lower.includes('fifa')) {
        replyText = "Awesome! Check out our player FIFA performance stat cards, ratings, and squad rosters!";
        actionLink = { label: '👀 Explore Squad Cards', path: '/squad' };
      } else if (lower.includes('standing') || lower.includes('table') || lower.includes('leaderboard')) {
        replyText = "Check out the League Standings page to see team points, goal differentials, and rankings.";
        actionLink = { label: '🏆 View League Standings', path: '/standings' };
      } else {
        replyText = "Ha, way outside my club duties 😄 — but ask me anything about KFC Football Club, match schedules, squad cards, or training sessions!";
        actionLink = { label: '⚽ Check Fixtures', path: '/fixtures' };
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText,
        actionLink,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 600);
  };

  const handleActionClick = (actionLink) => {
    if (!actionLink) return;
    if (actionLink.action === 'openChat') {
      setIsChatOpen(true);
      setIsOpen(false);
    } else if (actionLink.path) {
      navigate(actionLink.path);
      setIsOpen(false);
    }
  };

  if (isDismissed && !isOpen) {
    return (
      <div className="fixed bottom-3 right-3 z-40">
        <button
          onClick={handleRestore}
          className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-cyan-400 backdrop-blur-md hover:bg-slate-900 transition shadow-lg"
          title="Restore KickBot AI Assistant"
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
              aria-label="Open KickBot AI Assistant"
              title="Drag to reposition KickBot anywhere"
            >
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-cyan-200"></span>
              </span>
              <FiSmile className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12" />
              <span className="hidden sm:inline">{user ? `Hi, ${user.name.split(' ')[0]}` : 'KickBot AI'}</span>
              <FiZap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-300 ml-0.5 animate-pulse" />
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/90 text-slate-400 border border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-md transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
            title="Dismiss KickBot floating button"
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
                  <h3 className="text-sm font-bold text-white">KickBot AI</h3>
                  <span className="rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    Live Intelligent
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {user ? `Logged in as ${user.name}` : 'KFC Football Club Intelligence'}
                </p>
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
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.actionLink && (
                    <button
                      onClick={() => handleActionClick(msg.actionLink)}
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
                <span className="italic">KickBot is querying live data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 border-t border-white/5 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
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
