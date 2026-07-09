import { io, Socket } from 'socket.io-client';

// Socket nối tới GỐC backend (không kèm '/api'). Suy từ NEXT_PUBLIC_API_URL
// (vd http://localhost:3000/api → http://localhost:3000) để khỏi cấu hình
// thêm biến môi trường và không nối nhầm về chính FE.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || apiUrl.replace(/\/api\/?$/, '');

export const socket: Socket = io(SOCKET_URL || undefined, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

/**
 * Gắn access token vào handshake để BE xếp socket vào phòng user:{id} +
 * role:{role}. Gọi trước socket.connect() mỗi khi token thay đổi.
 */
export function setSocketAuth(token: string | null): void {
  socket.auth = token ? { token } : {};
}
