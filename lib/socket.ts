import { io, Socket } from 'socket.io-client';

// Điểm kết nối socket thực tế lấy theo host backend ở next.config.ts
const SOCKET_URL = process.env.SOCKET_URL;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
