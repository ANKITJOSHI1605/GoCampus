import { io } from 'socket.io-client';

// Assuming the backend is running on standard local dev port 5001
// Update this URL before deploying to production!
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('Connected to socket server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
});

export default socket; 
