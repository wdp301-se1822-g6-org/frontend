'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, RefreshCw, User, Minimize2, ArrowRight 
} from 'lucide-react';
import Image from 'next/image';
import { sendChatMessage, getChatSessionHistory } from '@/lib/chat-api';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface ApiChatMessage {
  role: string;
  content: string;
}

const QUICK_QUESTIONS = [
  'Cửa hàng mở cửa lúc mấy giờ?',
  'Có những gói dịch vụ rửa xe nào?',
  'Làm sao để tích điểm nâng hạng thành viên?',
  'Tôi có thể hủy lịch đặt trước không?'
];

export default function ChatbotWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào mừng quý khách đến với WAVE Auto-Wash! Tôi là trợ lý ảo, tôi có thể giúp gì cho quý khách hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(0);
  const nextMsgId = (prefix: string) => `${prefix}-${msgIdCounter.current++}`;

  // Cuộn xuống dưới cùng khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load session từ localStorage và nạp lại lịch sử nếu có
  useEffect(() => {
    if (pathname !== '/') return;

    const storedSession = localStorage.getItem('wave_chat_session_id');
    if (storedSession) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          setSessionId(storedSession);
          setIsLoading(true);
        }
      });
      getChatSessionHistory(storedSession)
        .then((res) => {
          const history = res.data?.messages ?? [];
          if (history.length > 0) {
            const formatted: Message[] = history.map((msg: ApiChatMessage, idx: number) => ({
              id: `msg-${idx}`,
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: msg.content
            }));
            setMessages(formatted);
          }
        })
        .catch(() => {
          localStorage.removeItem('wave_chat_session_id');
          setSessionId(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [pathname]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageText = textToSend.trim();
    setInput('');

    const userMsgId = nextMsgId('user');
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessageText }]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMessageText, sessionId || undefined);
      const data = res.data;
      if (data) {
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('wave_chat_session_id', data.sessionId);
        }

        setMessages(prev => [...prev, {
          id: nextMsgId('ai'),
          role: 'assistant',
          content: data.reply
        }]);
      }
    } catch (err) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi kết nối máy chủ.';
      toast.error(`Trợ lý lỗi: ${errMsg}`);
      setMessages(prev => [...prev, {
        id: nextMsgId('err'),
        role: 'assistant',
        content: 'Xin lỗi quý khách, đường truyền kết nối với máy chủ của tôi đang gặp chút sự cố. Quý khách vui lòng thử lại sau giây lát!'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới và xóa toàn bộ lịch sử chat không?')) {
      localStorage.removeItem('wave_chat_session_id');
      setSessionId(null);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chào mừng quý khách đến với WAVE Auto-Wash! Tôi đã làm mới cuộc hội thoại. Tôi có thể giúp gì cho quý khách lúc này?'
        }
      ]);
      toast.success('Đã làm mới cuộc hội thoại thành công.');
    }
  };

  // Chatbot chỉ hiển thị duy nhất trên trang chủ (URL là '/')
  if (pathname !== '/') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* ── BONG BÓNG CHAT NỔI (Floating Button) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 group focus:outline-none ring-4 ring-primary/10 cursor-pointer"
        >
          {/* Subtle primary glow pulse */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 pointer-events-none" />
          
          <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
          
          {/* Active green dot */}
          <span className="absolute -top-1 -right-1 bg-success border-2 border-white w-3.5 h-3.5 rounded-full" />
        </button>
      )}

      {/* ── KHUNG CỬA SỔ CHAT (Chat Window) ── */}
      {isOpen && (
        <div
          className="w-[360px] sm:w-[390px] h-[520px] bg-white/85 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out transform scale-100 opacity-100 animate-fade-in-up"
        >
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-primary/95 p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden">
            {/* Glass reflection line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/15 flex items-center justify-center shrink-0">
                <Image
                  src="/logo-wave.jpg"
                  alt="WAVE"
                  width={36}
                  height={36}
                  className="object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border border-slate-955 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm tracking-wide">
                  Trợ lý WAVE
                </h3>
                <p className="text-[10px] text-slate-350 font-medium">Tự động phản hồi • Hoạt động 24/7</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 relative z-10">
              <button 
                onClick={handleResetChat}
                title="Làm mới cuộc chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-placeholder hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg hover:bg-white/10 text-placeholder hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/40 scrollbar-thin">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${
                    isAi 
                      ? 'border-primary/10' 
                      : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    {isAi ? (
                      <Image
                        src="/logo-wave.jpg"
                        alt="WAVE"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs ${
                    isAi 
                      ? 'bg-white/90 border border-border text-foreground rounded-xl rounded-tl-sm' 
                      : 'bg-primary text-white rounded-xl rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full border border-primary/10 overflow-hidden shrink-0">
                  <Image
                    src="/logo-wave.jpg"
                    alt="WAVE"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <div className="bg-white/90 border border-border rounded-xl rounded-tl-sm px-4 py-3 text-xs shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQs Suggestions */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-white/70 backdrop-blur-md border-t border-border flex flex-col gap-1.5 shrink-0">
              <p className="text-[10px] font-bold text-placeholder uppercase tracking-widest pl-1 mb-0.5">Gợi ý câu hỏi thường gặp</p>
              <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary font-medium text-[11px] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all text-primary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="p-3 bg-white/80 backdrop-blur-md border-t border-border flex gap-2 shrink-0 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 bg-muted/40 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all placeholder:text-placeholder text-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
