import express from 'express';
import { body, validationResult } from 'express-validator';
import { Vote } from '../models/Vote';
import { Poll } from '../models/Poll';
import { Activity } from '../models/Activity';
import { authenticateToken, requireVerification, AuthenticatedRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchain';
import { EncryptionService } from '../services/encryption';

const router = express.Router();
const blockchainService = BlockchainService.getInstance();

// Submit vote
router.post('/', [
  authenticateToken,
  requireVerification,
  body('pollId').isMongoId(),
  body('optionId').exists(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { pollId, optionId } = req.body;
    const userId = req.user._id;

    // Check if poll exists and is active
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const now = new Date();
    if (now < poll.startTime || now > poll.endTime || !poll.isActive) {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    // Check if user is eligible to vote
    if (poll.eligibleVoters.length > 0 && !poll.eligibleVoters.includes(userId)) {
      return res.status(403).json({ message: 'You are not eligible to vote in this poll' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ pollId, voterId: userId });
    if (existingVote) {
      return res.status(409).json({ message: 'You have already voted in this poll' });
    }

    // Validate option exists
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Encrypt vote data
    const voteKey = EncryptionService.generateKey();
    const voteData = {
      pollId,
      optionId,
      voterId: userId,
      timestamp: new Date()
    };
    const encryptedVote = EncryptionService.encrypt(JSON.stringify(voteData), voteKey);

    // Add vote to blockchain
    const blockData = {
      type: 'vote',
      vote: {
        pollId,
        voterId: userId,
        encryptedVote,
        voteHash: EncryptionService.generateVoteHash(pollId, userId.toString(), optionId)
      }
    };

    const block = await blockchainService.addBlock(blockData);

    // Save vote to database
    const vote = new Vote({
      pollId,
      voterId: userId,
      encryptedVote,
      blockHash: block.hash,
      timestamp: new Date()
    });

    await vote.save();

    // Update poll statistics
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    await poll.save();

    // Log activity
    await Activity.create({
      type: 'vote',
      description: `Vote submitted for poll: ${poll.title}`,
      userId,
      pollId
    });

    // Broadcast update to connected clients
    const io = req.app.get('io');
    io.to(`poll_${pollId}`).emit('vote_update', {
      pollId,
      options: poll.options,
      totalVotes: poll.totalVotes
    });

    res.status(201).json({
      message: 'Vote submitted successfully',
      blockHash: block.hash,
      voteId: vote._id
    });
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vote status for a poll
router.get('/status/:pollId', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const vote = await Vote.findOne({ pollId, voterId: userId });
    
    res.json({
      hasVoted: !!vote,
      voteId: vote?._id,
      timestamp: vote?.timestamp
    });
  } catch (error) {
    console.error('Vote status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get votes for a poll (admin only)
router.get('/poll/:pollId', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const { pollId } = req.params;
    
    // Check if user is admin or poll creator
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (req.user.role !== 'admin' && poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const votes = await Vote.find({ pollId })
      .populate('voterId', 'email')
      .sort({ timestamp: -1 });

    res.json(votes);
  } catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify vote on blockchain
router.get('/verify/:voteId', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const { voteId } = req.params;
    
    const vote = await Vote.findById(voteId);
    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Only allow user to verify their own vote or admin
    if (vote.voterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Verify on blockchain
    const block = blockchainService.getBlockByHash(vote.blockHash);
    if (!block) {
      return res.status(404).json({ message: 'Block not found on blockchain' });
    }

    const isValid = blockchainService.validateChain();
    
    res.json({
      isValid,
      blockHash: vote.blockHash,
      blockIndex: block.index,
      blockTimestamp: block.timestamp,
      voteTimestamp: vote.timestamp
    });
  } catch (error) {
    console.error('Vote verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as voteRoutes };