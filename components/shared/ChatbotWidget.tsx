'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Sparkles, RefreshCw,
  Bot, User, Minimize2, ArrowRight 
} from 'lucide-react';
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
      content: 'Chào mừng ông chủ đến với WAVE Auto-Wash! 🌊 Tôi là trợ lý ảo AI, tôi có thể giúp gì cho ông chủ hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('wave_chat_session_id'));

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
    const storedSession = localStorage.getItem('wave_chat_session_id');
    if (storedSession) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) setIsLoading(true);
      });
      getChatSessionHistory(storedSession)
        .then((res) => {
          // Lấy trực tiếp từ res.data.messages theo cấu trúc backend thực tế
          const history = res.data?.messages ?? [];
          if (history.length > 0) {
            // Định dạng lại tin nhắn từ API khớp với state
            const formatted: Message[] = history.map((msg: ApiChatMessage, idx: number) => ({
              id: `msg-${idx}`,
              role: msg.role === 'model' ? 'assistant' : 'user', // Map role 'model' của BE thành 'assistant' của FE
              content: msg.content
            }));
            setMessages(formatted);
          }
        })
        .catch(() => {
          // Nếu session cũ bị lỗi/quá hạn, xóa đi để reset session mới
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
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageText = textToSend.trim();
    setInput('');

    // Thêm tin nhắn của User vào UI ngay lập tức
    const userMsgId = nextMsgId('user');
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessageText }]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMessageText, sessionId || undefined);
      const data = res.data; // Lấy trực tiếp từ res.data
      if (data) {
        // Lưu sessionId nếu là phiên mới
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('wave_chat_session_id', data.sessionId);
        }

        // Thêm câu trả lời của AI vào UI
        setMessages(prev => [...prev, {
          id: nextMsgId('ai'),
          role: 'assistant',
          content: data.reply // Dùng reply thay vì answer
        }]);
      }
    } catch (err) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi kết nối máy chủ AI.';
      toast.error(`Trợ lý AI lỗi: ${errMsg}`);
      setMessages(prev => [...prev, {
        id: nextMsgId('err'),
        role: 'assistant',
        content: '⚠️ Xin lỗi ông chủ, đường truyền kết nối với bộ não AI của tôi đang gặp chút sự cố. Ông chủ vui lòng thử lại sau giây lát!'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Ông chủ có chắc chắn muốn làm mới và xóa toàn bộ lịch sử chat không?')) {
      localStorage.removeItem('wave_chat_session_id');
      setSessionId(null);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chào mừng ông chủ đến với WAVE Auto-Wash! 🌊 Tôi đã làm mới cuộc hội thoại. Tôi có thể giúp gì cho ông chủ lúc này?'
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
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-indigo-500/30 active:scale-95 group focus:outline-none ring-4 ring-indigo-500/10"
        >
          {/* Neon Glow Pulse Effect */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-75 pointer-events-none" />
          
          <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
          
          {/* Badge Trợ lý AI */}
          <span className="absolute -top-1 -right-1 bg-emerald-500 border-2 border-white w-3.5 h-3.5 rounded-full animate-pulse" />
        </button>
      )}

      {/* ── KHUNG CỬA SỔ CHAT (Chat Window) ── */}
      {isOpen && (
        <div className="w-[360px] sm:w-[390px] h-[520px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm tracking-wide flex items-center gap-1">
                  Trợ lý WAVE AI <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Tự động trả lời • Hoạt động 24/7</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetChat}
                title="Làm mới cuộc chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-thin">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isAi 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed shadow-sm ${
                    isAi 
                      ? 'bg-white text-slate-700 border border-slate-100' 
                      : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-slate-700 border border-slate-100 rounded-2xl px-4 py-3 text-xs shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQs Suggestions */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-1.5 shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1 mb-0.5">Gợi ý câu hỏi thường gặp</p>
              <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 font-semibold text-[11px] transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="p-3 bg-white border-t border-slate-150/60 flex gap-2 shrink-0 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của ông chủ..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-350 text-slate-700"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
