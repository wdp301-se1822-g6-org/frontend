import { axiosInstance } from '@/lib/axios';

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
  toolsCalled?: any[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface SessionHistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
}

/**
 * Gửi tin nhắn lên Trợ lý AI Chatbot
 */
export const sendChatMessage = (message: string, sessionId?: string) =>
  axiosInstance.post<SendMessageResponse>('/chat/message', {
    message,
    sessionId,
  });

/**
 * Lấy lịch sử hội thoại của một phiên chat
 */
export const getChatSessionHistory = (sessionId: string) =>
  axiosInstance.get<SessionHistoryResponse>(`/chat/sessions/${sessionId}`);
