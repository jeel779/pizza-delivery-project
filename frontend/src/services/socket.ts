import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (userId: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('Socket.io connected client-side');
      s.emit('joinRoom', userId);
    });
  } else {
    s.emit('joinRoom', userId);
  }
};

export const connectAdminSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('Socket.io connected admin-side');
      s.emit('joinAdminRoom');
    });
  } else {
    s.emit('joinAdminRoom');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket.io disconnected client-side');
  }
};
