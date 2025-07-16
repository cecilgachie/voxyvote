# VoxVote - Secure Blockchain Voting Platform

VoxVote is a production-ready, secure blockchain-based voting platform built with the MERN stack. It provides end-to-end encrypted voting with real-time results and comprehensive audit trails.

## 🚀 Features

### Core Functionality
- **Blockchain-based Vote Storage**: Custom blockchain implementation with proof-of-work consensus
- **End-to-End Encryption**: All votes are encrypted before storage
- **Real-time Updates**: Live voting results and activity feeds
- **Multi-Factor Authentication**: Email verification + 2FA support
- **Role-based Access Control**: Admin and voter roles with appropriate permissions
- **Audit Trail**: Complete activity logging for all platform actions

### Security Features
- JWT-based authentication with 1-hour expiration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- HTTPS enforcement
- XSS and CSRF protection
- Password strength requirements
- Secure blockchain validation

### Technical Features
- Responsive design with mobile-first approach
- Progressive Web App (PWA) capabilities
- Real-time WebSocket connections
- Comprehensive error handling
- Database optimization with indexing
- Scalable architecture

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Chart.js** for data visualization
- **Socket.io Client** for real-time features
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Speakeasy** for 2FA
- **Express Rate Limit** for API protection

### Security & Blockchain
- Custom blockchain implementation with SHA-256
- Proof-of-work consensus mechanism
- AES-256-GCM encryption for vote data
- Comprehensive audit logging
- Real-time blockchain validation

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/voxvote.git
cd voxvote
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Environment Configuration**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the environment variables
nano server/.env
```

4. **Start development servers**
```bash
# Start both frontend and backend
npm run dev:full

# Or start separately
npm run server:dev  # Backend on port 3001
npm run dev         # Frontend on port 5173
```

### Production Setup

1. **Build the application**
```bash
npm run build
npm run server:build
```

2. **Start production server**
```bash
npm run server:start
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/setup-2fa` - Setup two-factor authentication
- `POST /api/auth/enable-2fa` - Enable two-factor authentication
- `GET /api/auth/me` - Get current user

### Poll Endpoints
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get specific poll
- `POST /api/polls` - Create new poll (admin only)
- `PUT /api/polls/:id` - Update poll (admin only)
- `DELETE /api/polls/:id` - Delete poll (admin only)
- `GET /api/polls/:id/results` - Get poll results

### Vote Endpoints
- `POST /api/votes` - Submit vote
- `GET /api/votes/status/:pollId` - Check vote status
- `GET /api/votes/poll/:pollId` - Get poll votes (admin only)
- `GET /api/votes/verify/:voteId` - Verify vote on blockchain

### Blockchain Endpoints
- `GET /api/blockchain/stats` - Get blockchain statistics
- `GET /api/blockchain` - Get full blockchain (admin only)
- `GET /api/blockchain/block/:hash` - Get specific block
- `GET /api/blockchain/validate` - Validate blockchain integrity

## 🔒 Security Implementation

### Authentication Flow
1. User registration with email verification
2. Strong password requirements
3. Optional 2FA setup with QR code
4. JWT token with 1-hour expiration
5. Refresh token mechanism

### Vote Security
1. Vote encryption before blockchain storage
2. Unique vote hashes to prevent tampering
3. Blockchain validation on every vote
4. Audit trail for all voting actions
5. One vote per user per poll enforcement

### Data Protection
- All sensitive data encrypted at rest
- HTTPS enforcement in production
- Input validation and sanitization
- Rate limiting on all API endpoints
- CORS configuration for frontend-backend communication

## 🏗 Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard components
│   ├── layout/        # Layout components
│   ├── ui/           # Reusable UI components
│   └── voting/       # Voting interface components
├── contexts/         # React contexts
├── services/         # API and external services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### Backend Architecture
```
server/src/
├── middleware/       # Express middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic services
└── utils/           # Utility functions
```

### Database Schema
- **Users**: Authentication and profile data
- **Polls**: Poll configuration and options
- **Votes**: Encrypted vote data with blockchain references
- **Blocks**: Blockchain block storage
- **Activities**: Audit trail and activity logs

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d
```

### Manual Deployment
1. Set up MongoDB instance
2. Configure environment variables
3. Build and deploy frontend
4. Start backend server
5. Configure reverse proxy (nginx)

## 📈 Performance Monitoring

### Key Metrics
- API response time < 200ms
- Blockchain validation time
- WebSocket connection stability
- Database query performance
- Memory usage and CPU utilization

### Monitoring Tools
- Application logging
- Performance metrics
- Error tracking
- Real-time monitoring dashboard

## 🔐 Security Audit

### Regular Security Checks
- Dependency vulnerability scanning
- Code security analysis
- Penetration testing
- Blockchain integrity validation
- Access log analysis

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@voxvote.com or create an issue in the GitHub repository.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core voting functionality
- ✅ Blockchain implementation
- ✅ Real-time features
- ✅ Security implementation

### Phase 2 (Planned)
- 🔄 Mobile app development
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 API rate limiting improvements

### Phase 3 (Future)
- 🔄 Decentralized storage
- 🔄 Advanced cryptography
- 🔄 AI-powered fraud detection
- 🔄 Scalability improvements

---

Built with ❤️ by the VoxVote team"# voxyvote" 
"# voxyvote" 
