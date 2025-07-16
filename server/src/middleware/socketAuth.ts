import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('Invalid token'));
    }

    socket.data.userId = user._id;
    socket.data.userRole = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};