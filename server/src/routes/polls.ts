import express from 'express';
import { body, validationResult } from 'express-validator';
import { Poll } from '../models/Poll';
import { Activity } from '../models/Activity';
import { authenticateToken, requireVerification, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all polls
router.get('/', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const polls = await Poll.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Poll.countDocuments();

    res.json({
      polls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single poll
router.get('/:id', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create poll (admin only)
router.post('/', [
  authenticateToken,
  requireVerification,
  requireRole(['admin']),
  body('title').isLength({ min: 3, max: 200 }).trim(),
  body('description').isLength({ min: 10, max: 1000 }).trim(),
  body('options').isArray({ min: 2, max: 10 }),
  body('options.*.text').isLength({ min: 1, max: 200 }).trim(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { title, description, options, startTime, endTime, eligibleVoters } = req.body;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Create poll options with IDs
    const pollOptions = options.map((option: any) => ({
      id: uuidv4(),
      text: option.text,
      votes: 0
    }));

    const poll = new Poll({
      title,
      description,
      options: pollOptions,
      startTime: start,
      endTime: end,
      eligibleVoters: eligibleVoters || [],
      createdBy: req.user._id,
      totalVotes: 0
    });

    await poll.save();

    // Log activity
    await Activity.create({
      type: 'poll_created',
      description: `New poll created: ${title}`,
      userId: req.user._id,
      pollId: poll._id
    });

    // Broadcast to connected clients
    const io = req.app.get('io');
    io.emit('poll_update', {
      type: 'new_poll',
      poll: poll
    });

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update poll (admin only)
router.put('/:id', [
  authenticateToken,
  requireVerification,
  requireRole(['admin']),
  body('title').optional().isLength({ min: 3, max: 200 }).trim(),
  body('description').optional().isLength({ min: 10, max: 1000 }).trim(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user is admin or poll creator
    if (req.user.role !== 'admin' && poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Don't allow updates if poll has started and has votes
    if (poll.totalVotes > 0) {
      return res.status(400).json({ message: 'Cannot update poll with existing votes' });
    }

    const { title, description, startTime, endTime, isActive } = req.body;

    if (title) poll.title = title;
    if (description) poll.description = description;
    if (startTime) poll.startTime = new Date(startTime);
    if (endTime) poll.endTime = new Date(endTime);
    if (typeof isActive === 'boolean') poll.isActive = isActive;

    await poll.save();

    // Broadcast update
    const io = req.app.get('io');
    io.emit('poll_update', {
      type: 'poll_updated',
      poll: poll
    });

    res.json({
      message: 'Poll updated successfully',
      poll
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete poll (admin only)
router.delete('/:id', [
  authenticateToken,
  requireVerification,
  requireRole(['admin']),
], async (req: AuthenticatedRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user is admin or poll creator
    if (req.user.role !== 'admin' && poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Don't allow deletion if poll has votes
    if (poll.totalVotes > 0) {
      return res.status(400).json({ message: 'Cannot delete poll with existing votes' });
    }

    await Poll.findByIdAndDelete(req.params.id);

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get poll results
router.get('/:id/results', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const results = {
      pollId: poll._id,
      title: poll.title,
      description: poll.description,
      totalVotes: poll.totalVotes,
      options: poll.options,
      startTime: poll.startTime,
      endTime: poll.endTime,
      isActive: poll.isActive,
      isCurrentlyActive: poll.isCurrentlyActive
    };

    res.json(results);
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as pollRoutes };