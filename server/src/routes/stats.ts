import express from 'express';
import { Poll } from '../models/Poll';
import { Vote } from '../models/Vote';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { authenticateToken, requireVerification, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get platform statistics
router.get('/', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const [totalPolls, totalVotes, totalUsers, totalActivePolls] = await Promise.all([
      Poll.countDocuments(),
      Vote.countDocuments(),
      User.countDocuments(),
      Poll.countDocuments({
        isActive: true,
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
      })
    ]);

    res.json({
      totalPolls,
      totalVotes,
      totalUsers,
      totalActivePolls
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user statistics
router.get('/user', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user._id;

    const [votesCount, pollsCreated, recentVotes] = await Promise.all([
      Vote.countDocuments({ voterId: userId }),
      Poll.countDocuments({ createdBy: userId }),
      Vote.find({ voterId: userId })
        .populate('pollId', 'title')
        .sort({ timestamp: -1 })
        .limit(5)
    ]);

    res.json({
      votesCount,
      pollsCreated,
      recentVotes
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get voting trends
router.get('/trends', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyVotes = await Vote.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dailyPolls = await Poll.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      dailyVotes,
      dailyPolls
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as statsRoutes };