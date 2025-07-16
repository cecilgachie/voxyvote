import crypto from 'crypto';
import { Block } from '../models/Block';
import { IBlock } from '../models/Block';

export interface BlockData {
  type: string;
  vote?: any;
  poll?: any;
  user?: any;
  message?: string;
}

export class BlockchainService {
  private static instance: BlockchainService;
  private blockchain: IBlock[] = [];
  private difficulty = 4;

  private constructor() {
    this.initializeBlockchain();
  }

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  private async initializeBlockchain(): Promise<void> {
    try {
      // Load existing blockchain from database
      const existingBlocks = await Block.find().sort({ index: 1 });
      
      if (existingBlocks.length === 0) {
        // Create genesis block if no blocks exist
        await this.createGenesisBlock();
      } else {
        this.blockchain = existingBlocks;
        console.log(`Loaded ${existingBlocks.length} blocks from database`);
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      await this.createGenesisBlock();
    }
  }

  private async createGenesisBlock(): Promise<void> {
    const genesisData: BlockData = {
      type: 'genesis',
      message: 'VoxVote Genesis Block - Secure Blockchain Voting Platform'
    };

    const genesisBlock = new Block({
      index: 0,
      timestamp: new Date(),
      data: genesisData,
      previousHash: '0',
      hash: this.calculateHash(0, new Date(), genesisData, '0', 0),
      nonce: 0
    });

    await genesisBlock.save();
    this.blockchain.push(genesisBlock);
    console.log('Genesis block created');
  }

  private calculateHash(
    index: number,
    timestamp: Date,
    data: any,
    previousHash: string,
    nonce: number
  ): string {
    return crypto
      .createHash('sha256')
      .update(index + timestamp.toISOString() + JSON.stringify(data) + previousHash + nonce)
      .digest('hex');
  }

  private mineBlock(block: IBlock): void {
    const target = Array(this.difficulty + 1).join('0');
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(
        block.index,
        block.timestamp,
        block.data,
        block.previousHash,
        block.nonce
      );
    }
    
    console.log(`Block mined: ${block.hash}`);
  }

  async addBlock(data: BlockData): Promise<IBlock> {
    const previousBlock = this.blockchain[this.blockchain.length - 1];
    
    const newBlock = new Block({
      index: this.blockchain.length,
      timestamp: new Date(),
      data,
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0
    });

    // Calculate initial hash
    newBlock.hash = this.calculateHash(
      newBlock.index,
      newBlock.timestamp,
      newBlock.data,
      newBlock.previousHash,
      newBlock.nonce
    );

    // Mine the block
    this.mineBlock(newBlock);

    // Save to database
    await newBlock.save();
    this.blockchain.push(newBlock);
    
    return newBlock;
  }

  validateChain(): boolean {
    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const previousBlock = this.blockchain[i - 1];

      // Validate current block hash
      const calculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce
      );

      if (currentBlock.hash !== calculatedHash) {
        console.error(`Invalid hash at block ${i}`);
        return false;
      }

      // Validate link to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Invalid previous hash at block ${i}`);
        return false;
      }

      // Validate proof of work
      if (currentBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
        console.error(`Invalid proof of work at block ${i}`);
        return false;
      }
    }

    return true;
  }

  getBlockchain(): IBlock[] {
    return [...this.blockchain];
  }

  getBlockByHash(hash: string): IBlock | undefined {
    return this.blockchain.find(block => block.hash === hash);
  }

  getBlocksByType(type: string): IBlock[] {
    return this.blockchain.filter(block => block.data.type === type);
  }

  async getVotesByPoll(pollId: string): Promise<any[]> {
    const voteBlocks = this.blockchain.filter(
      block => block.data.type === 'vote' && block.data.vote.pollId === pollId
    );
    
    return voteBlocks.map(block => block.data.vote);
  }

  getLatestBlock(): IBlock | null {
    return this.blockchain.length > 0 ? this.blockchain[this.blockchain.length - 1] : null;
  }

  getBlockchainStats(): any {
    return {
      totalBlocks: this.blockchain.length,
      isValid: this.validateChain(),
      latestBlock: this.getLatestBlock(),
      genesisBlock: this.blockchain[0],
      difficulty: this.difficulty
    };
  }
}