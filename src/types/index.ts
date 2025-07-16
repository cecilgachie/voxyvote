export interface User {
  id: string;
  email: string;
  role: 'voter' | 'admin';
  verified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  eligibleVoters: string[];
  createdBy: string;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  pollId: string;
  voterId: string;
  encryptedVote: string;
  timestamp: Date;
  blockHash: string;
}

export interface Block {
  index: number;
  timestamp: Date;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface VoteStats {
  totalVotes: number;
  totalActivePolls: number;
  totalUsers: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'vote' | 'poll_created' | 'user_registered';
  description: string;
  timestamp: Date;
  userId?: string;
}