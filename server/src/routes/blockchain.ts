import express from 'express';
import { BlockchainService } from '../services/blockchain';
import { authenticateToken, requireVerification, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const blockchainService = BlockchainService.getInstance();

// Get blockchain stats
router.get('/stats', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const stats = blockchainService.getBlockchainStats();
    res.json(stats);
  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get blockchain (admin only)
router.get('/', [
  authenticateToken,
  requireVerification,
  requireRole(['admin']),
], async (req: AuthenticatedRequest, res) => {
  try {
    const blockchain = blockchainService.getBlockchain();
    res.json(blockchain);
  } catch (error) {
    console.error('Get blockchain error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific block
router.get('/block/:hash', [
  authenticateToken,
  requireVerification,
], async (req: AuthenticatedRequest, res) => {
  try {
    const { hash } = req.params;
    const block = blockchainService.getBlockByHash(hash);
    
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.json(block);
  } catch (error) {
    console.error('Get block error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate blockchain
router.get('/validate', [
  authenticateToken,
  requireVerification,
  requireRole(['admin']),
], async (req: AuthenticatedRequest, res) => {
  try {
    const isValid = blockchainService.validateChain();
    res.json({ 
      isValid,
      message: isValid ? 'Blockchain is valid' : 'Blockchain validation failed'
    });
  } catch (error) {
    console.error('Validate blockchain error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as blockchainRoutes };