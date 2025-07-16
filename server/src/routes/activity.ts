import express from 'express';
import { Activity } from '../models/Activity';
import { authenticateToken, requireVerification, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get recent activity
router.get('/', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .populate('userId', 'email')
      .populate('pollId', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments();

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's activity
router.get('/user', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ userId })
      .populate('pollId', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments({ userId });

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as activityRoutes };