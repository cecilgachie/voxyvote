import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { pollRoutes } from './routes/polls';
import { voteRoutes } from './routes/votes';
import { statsRoutes } from './routes/stats';
import { activityRoutes } from './routes/activity';
import { blockchainRoutes } from './routes/blockchain';
import { errorHandler } from './middleware/errorHandler';
import { authenticateSocket } from './middleware/socketAuth';
import { BlockchainService } from './services/blockchain';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voxvote', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Initialize blockchain service
const blockchainService = BlockchainService.getInstance();

// Socket.IO authentication
io.use(authenticateSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.data.userId);

  socket.on('join_poll', (pollId: string) => {
    socket.join(`poll_${pollId}`);
    console.log(`User ${socket.data.userId} joined poll ${pollId}`);
  });

  socket.on('leave_poll', (pollId: string) => {
    socket.leave(`poll_${pollId}`);
    console.log(`User ${socket.data.userId} left poll ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.data.userId);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    blockchain: {
      isValid: blockchainService.validateChain(),
      blocks: blockchainService.getBlockchain().length
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`VoxVote server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});

export { io };