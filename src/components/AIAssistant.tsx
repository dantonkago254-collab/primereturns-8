import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { formatKSH } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageContext = 'dashboard' | 'investments' | 'referrals' | 'account' | 'general';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  pageContext?: PageContext;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_SERVICE_URL = 'https://prime-returns-ai-production.up.railway.app/chat';

const CONTEXT_WELCOME: Record<PageContext, string> = {
  dashboard:
    '👋 Welcome back! I\'m your PrimeReturns AI advisor. Did you know your balance is working for you right now? Ask me how to maximise your daily returns or grow your referral network!',
  investments:
    '📈 Looking at investment plans? I can show you exactly how much you\'d earn daily at each tier. Ask me anything — "How much will KSh 50,000 earn?" or "Which plan is best for me?"',
  referrals:
    '🤝 Referrals are one of the fastest ways to grow your income here! You earn up to 10% commission on every person you invite. Want to know how to share your link effectively?',
  account:
    '⚙️ Managing your account? I can help you understand withdrawal terms, security tips, or how to make the most of your PrimeReturns membership.',
  general:
    '💬 Hi! I\'m your PrimeReturns AI assistant. Ask me anything about investment plans, referral commissions, or how to grow your wealth on the platform!',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).slice(2, 9);

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── Component ────────────────────────────────────────────────────────────────

export const AIAssistant = ({ pageContext = 'general' }: AIAssistantProps) => {
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop the attention pulse after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimised) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimised]);

  // Inject the contextual welcome message the first time the chat opens
  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimised(false);
    setShowPulse(false);

    if (!hasGreeted) {
      setHasGreeted(true);

      // Build a richer welcome when we know the user's balance
      let welcomeText = CONTEXT_WELCOME[pageContext];
      if (user && user.accountBalance > 0 && pageContext === 'dashboard') {
        const daily5 = user.accountBalance * 0.05;
        const daily10 = user.accountBalance * 0.10;
        welcomeText = `👋 Karibu, ${user.name}! Your current balance of ${formatKSH(user.accountBalance)} could be earning between ${formatKSH(daily5)} and ${formatKSH(daily10)} every single day. Want to know how to unlock the highest tier? Just ask!`;
      }

      const greeting: Message = {
        id: generateId(),
        role: 'assistant',
        text: welcomeText,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [hasGreeted, pageContext, user]);

  // Build a system-level context string to send alongside every user message
  const buildSystemContext = useCallback((): string => {
    const parts: string[] = [
      'You are a friendly, knowledgeable investment advisor for PrimeReturns — a Kenyan investment platform.',
      'Always respond in a warm, encouraging, and professional tone.',
      'Keep answers concise (2–4 sentences) unless the user asks for detail.',
      'Encourage users to invest and refer friends where appropriate, but never be pushy.',
      'All monetary values are in Kenyan Shillings (KSh).',
      '',
      'Platform facts:',
      '• Starter Node: KSh 1,000–10,000 → 5% daily return',
      '• Growth Engine: KSh 10,001–100,000 → 7.5% daily return',
      '• Titan Core: KSh 100,001+ → 10% daily return',
      '• Referral commissions: up to 10% on direct referrals (3 levels deep)',
      '• Minimum withdrawal: KSh 10,000',
      '• Withdrawals require at least 1 active referral',
      '• 14-day cooldown between withdrawals',
      '• Payments via M-Pesa (Mon–Fri)',
    ];

    if (user) {
      parts.push('', 'Current user context:');
      parts.push(`• Name: ${user.name}`);
      parts.push(`• Account balance: ${formatKSH(user.accountBalance)}`);
      parts.push(`• Total invested: ${formatKSH(user.totalInvested)}`);
      parts.push(`• Total earned: ${formatKSH(user.totalEarned)}`);
      parts.push(`• Referral earnings: ${formatKSH(user.totalReferralEarnings)}`);
    }

    parts.push('', `Current page: ${pageContext}`);

    return parts.join('\n');
  }, [user, pageContext]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(AI_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: buildSystemContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      const data = await response.json();
      const replyText: string =
        data.message || data.reply || data.response || data.text ||
        'I\'m having trouble connecting right now. Please try again in a moment!';

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        text: 'I apologize for the technical difficulty. Please try your question again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, buildSystemContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating trigger button ── */}
      {!isOpen && (
        <button
          onClick={openChat}
          aria-label="Open AI assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.45)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.45)';
          }}
        >
          🤖
          {/* Attention pulse ring */}
          {showPulse && (
            <span
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '3px solid rgba(102, 126, 234, 0.6)',
                animation: 'ai-pulse 1.6s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="PrimeReturns AI Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: 'min(380px, calc(100vw - 32px))',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            animation: 'ai-slide-up 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
                PrimeReturns AI
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
                Your investment advisor
              </p>
            </div>
            {/* Online indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  display: 'inline-block',
                  boxShadow: '0 0 0 2px rgba(74,222,128,0.3)',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600 }}>Online</span>
            </div>
            {/* Minimise */}
            <button
              onClick={() => setIsMinimised((v) => !v)}
              aria-label={isMinimised ? 'Expand chat' : 'Minimise chat'}
              style={headerBtnStyle}
            >
              {isMinimised ? '▲' : '▼'}
            </button>
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={headerBtnStyle}
            >
              ✕
            </button>
          </div>

          {/* Body — hidden when minimised */}
          {!isMinimised && (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '340px',
                  background: '#f8f9fc',
                }}
              >
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '40px' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🤖</p>
                    <p style={{ margin: 0 }}>Opening your AI advisor…</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#ffffff',
                        color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                        fontSize: '13.5px',
                        lineHeight: '1.55',
                        boxShadow:
                          msg.role === 'user'
                            ? '0 2px 12px rgba(102,126,234,0.3)'
                            : '0 2px 8px rgba(0,0,0,0.06)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        marginTop: '4px',
                        paddingLeft: msg.role === 'assistant' ? '4px' : '0',
                        paddingRight: msg.role === 'user' ? '4px' : '0',
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: '18px 18px 18px 4px',
                        background: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        display: 'flex',
                        gap: '5px',
                        alignItems: 'center',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            display: 'inline-block',
                            animation: `ai-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion chips */}
              {messages.length <= 1 && !isLoading && (
                <div
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    background: '#f8f9fc',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  {getSuggestions(pageContext, user?.accountBalance).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        border: '1.5px solid #e2e8f0',
                        background: '#fff',
                        color: '#667eea',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                        (e.currentTarget as HTMLButtonElement).style.color = '#667eea';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything…"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#1e293b',
                    background: '#f8f9fc',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    border: 'none',
                    background:
                      !input.trim() || isLoading
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: !input.trim() || isLoading ? '#94a3b8' : '#ffffff',
                    cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow:
                      !input.trim() || isLoading
                        ? 'none'
                        : '0 4px 12px rgba(102,126,234,0.35)',
                  }}
                >
                  ➤
                </button>
              </div>

              {/* Footer branding */}
              <div
                style={{
                  padding: '6px 16px 10px',
                  textAlign: 'center',
                  background: '#ffffff',
                }}
              >
                <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 500 }}>
                  Powered by PrimeReturns AI · Always verify before investing
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Keyframe animations injected once ── */}
      <style>{`
        @keyframes ai-pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.5); opacity: 0;   }
          100% { transform: scale(1.5); opacity: 0;   }
        }
        @keyframes ai-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes ai-bounce {
          0%, 80%, 100% { transform: translateY(0);    }
          40%            { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
};

// ─── Shared header button style ───────────────────────────────────────────────

const headerBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  border: 'none',
  background: 'rgba(255,255,255,0.15)',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  flexShrink: 0,
  transition: 'background 0.15s ease',
};

// ─── Context-aware suggestion chips ──────────────────────────────────────────

function getSuggestions(context: PageContext, balance?: number): string[] {
  const base: Record<PageContext, string[]> = {
    dashboard: [
      'How much can I earn daily?',
      'How do referrals work?',
      'When can I withdraw?',
    ],
    investments: [
      'Which plan earns the most?',
      'How much will KSh 50,000 earn?',
      'What is the Titan Core plan?',
    ],
    referrals: [
      'How much do I earn per referral?',
      'How many levels deep?',
      'Tips to get more referrals?',
    ],
    account: [
      'How do I withdraw?',
      'What are the withdrawal rules?',
      'How do I update my phone?',
    ],
    general: [
      'How does PrimeReturns work?',
      'What plans are available?',
      'How do I get started?',
    ],
  };

  const suggestions = [...base[context]];

  // Personalise if we know the balance
  if (balance && balance > 0) {
    suggestions.unshift(`Earnings on my ${formatKSH(balance)} balance?`);
    if (suggestions.length > 3) suggestions.pop();
  }

  return suggestions.slice(0, 3);
}
