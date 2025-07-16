import { Block, Vote } from '../types';

class BlockchainService {
  private static instance: BlockchainService;
  private blockchain: Block[] = [];

  private constructor() {
    this.createGenesisBlock();
  }

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date(),
      data: { type: 'genesis', message: 'VoxVote Genesis Block' },
      previousHash: '0',
      hash: this.calculateHash(0, new Date(), { type: 'genesis' }, '0', 0),
      nonce: 0
    };
    this.blockchain.push(genesisBlock);
  }

  private calculateHash(index: number, timestamp: Date, data: any, previousHash: string, nonce: number): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(index + timestamp + JSON.stringify(data) + previousHash + nonce)
      .digest('hex');
  }

  private mineBlock(block: Block, difficulty: number = 4): void {
    const target = Array(difficulty + 1).join('0');
    
    while (block.hash.substring(0, difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(
        block.index,
        block.timestamp,
        block.data,
        block.previousHash,
        block.nonce
      );
    }
  }

  addVoteBlock(vote: Vote): Block {
    const previousBlock = this.blockchain[this.blockchain.length - 1];
    const newBlock: Block = {
      index: this.blockchain.length,
      timestamp: new Date(),
      data: { type: 'vote', vote },
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0
    };

    newBlock.hash = this.calculateHash(
      newBlock.index,
      newBlock.timestamp,
      newBlock.data,
      newBlock.previousHash,
      newBlock.nonce
    );

    this.mineBlock(newBlock);
    this.blockchain.push(newBlock);
    
    return newBlock;
  }

  validateChain(): boolean {
    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const previousBlock = this.blockchain[i - 1];

      const calculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce
      );

      if (currentBlock.hash !== calculatedHash) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getBlockchain(): Block[] {
    return [...this.blockchain];
  }

  getBlockByHash(hash: string): Block | undefined {
    return this.blockchain.find(block => block.hash === hash);
  }

  getVotesByPoll(pollId: string): Vote[] {
    return this.blockchain
      .filter(block => block.data.type === 'vote' && block.data.vote.pollId === pollId)
      .map(block => block.data.vote);
  }
}

export const blockchainService = BlockchainService.getInstance();