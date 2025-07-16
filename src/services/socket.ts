import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string): void {
    this.socket = io(process.env.NODE_ENV === 'production' 
      ? 'https://your-production-api.com' 
      : 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to VoxVote server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from VoxVote server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onVoteUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('vote_update', callback);
    }
  }

  onPollUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('poll_update', callback);
    }
  }

  onNewActivity(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('new_activity', callback);
    }
  }

  joinPoll(pollId: string): void {
    if (this.socket) {
      this.socket.emit('join_poll', pollId);
    }
  }

  leavePoll(pollId: string): void {
    if (this.socket) {
      this.socket.emit('leave_poll', pollId);
    }
  }

  off(event: string, callback?: Function): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = SocketService.getInstance();