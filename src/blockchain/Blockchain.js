const Block = require("./Block");
const Transaction = require("./Transaction");
const Wallet = require("./Wallet");
const { Level } = require("level");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.db = new Level("./data/blockchain");
    this.wallets = new Map();
    this.loadFromDatabase();
  }

  // 创建创世区块
  createGenesisBlock() {
    const genesisBlock = new Block(Date.now(), [], "0");
    genesisBlock.hash = genesisBlock.calculateHash();
    return genesisBlock;
  }

  // 获取最新区块
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 挖矿
  async minePendingTransactions(miningRewardAddress) {
    // 创建挖矿奖励交易
    const rewardTx = Transaction.createRewardTransaction(
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    // 创建新区块
    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.difficulty = this.difficulty;

    // 挖矿
    console.log("开始挖矿...");
    const startTime = Date.now();
    block.mineBlock();
    const endTime = Date.now();
    console.log(`挖矿完成，耗时: ${endTime - startTime}ms`);

    // 添加区块到链上
    this.chain.push(block);

    // 重置待处理交易
    this.pendingTransactions = [];

    // 更新钱包余额
    this.updateBalances();

    // 保存到数据库
    await this.saveToDatabase();

    return block;
  }

  // 添加交易到待处理队列
  addTransaction(transaction) {
    if (
      !transaction.fromAddress ||
      !transaction.toAddress
    ) {
      throw new Error("交易必须包含发送方和接收方地址！");
    }

    if (!transaction.isValid()) {
      throw new Error("无法添加无效交易到链上！");
    }

    if (transaction.amount <= 0) {
      throw new Error("交易金额必须大于0！");
    }

    // 检查发送方余额
    const senderBalance = this.getBalanceOfAddress(
      transaction.fromAddress
    );
    if (senderBalance < transaction.amount) {
      throw new Error("余额不足！");
    }

    this.pendingTransactions.push(transaction);
    console.log("交易已添加到待处理队列");
  }

  // 获取地址余额
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  // 验证区块链是否有效
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 验证当前区块的哈希
      if (
        currentBlock.hash !== currentBlock.calculateHash()
      ) {
        return false;
      }

      // 验证区块链接
      if (
        currentBlock.previousHash !== previousBlock.hash
      ) {
        return false;
      }

      // 验证区块中的交易
      if (!currentBlock.hasValidTransactions()) {
        return false;
      }
    }
    return true;
  }

  // 创建新钱包
  createWallet() {
    const wallet = Wallet.createWallet();
    this.wallets.set(wallet.getAddress(), wallet);
    return wallet;
  }

  // 获取钱包
  getWallet(address) {
    return this.wallets.get(address);
  }

  // 更新所有钱包余额
  updateBalances() {
    for (const [address, wallet] of this.wallets) {
      wallet.balance = this.getBalanceOfAddress(address);
    }
  }

  // 铸造代币
  mintTokens(toAddress, amount) {
    const mintTx = Transaction.createMintTransaction(
      toAddress,
      amount
    );
    this.pendingTransactions.push(mintTx);
    console.log(
      `已铸造 ${amount} 个代币到地址: ${toAddress}`
    );
  }

  // 获取区块链统计信息
  getStats() {
    return {
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      totalWallets: this.wallets.size,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      isValid: this.isChainValid(),
    };
  }

  // 获取所有区块
  getAllBlocks() {
    return this.chain.map((block) => block.toJSON());
  }

  // 获取特定区块
  getBlock(hash) {
    return this.chain.find((block) => block.hash === hash);
  }

  // 获取所有交易
  getAllTransactions() {
    const transactions = [];
    for (const block of this.chain) {
      transactions.push(...block.transactions);
    }
    return transactions.map((tx) => tx.toJSON());
  }

  // 保存到数据库
  async saveToDatabase() {
    try {
      await this.db.put(
        "chain",
        JSON.stringify(
          this.chain.map((block) => block.toJSON())
        )
      );
      await this.db.put(
        "wallets",
        JSON.stringify(Array.from(this.wallets.entries()))
      );
      await this.db.put(
        "pendingTransactions",
        JSON.stringify(
          this.pendingTransactions.map((tx) => tx.toJSON())
        )
      );
    } catch (error) {
      console.error("保存到数据库失败:", error);
    }
  }

  // 从数据库加载
  async loadFromDatabase() {
    try {
      const chainData = await this.db.get("chain");
      if (chainData) {
        this.chain = JSON.parse(chainData).map(
          (blockData) => Block.fromJSON(blockData)
        );
      }

      const walletsData = await this.db.get("wallets");
      if (walletsData) {
        const walletsArray = JSON.parse(walletsData);
        this.wallets = new Map(
          walletsArray.map(([address, walletData]) => [
            address,
            Wallet.fromJSON(walletData),
          ])
        );
      }

      const pendingTxData = await this.db.get(
        "pendingTransactions"
      );
      if (pendingTxData) {
        this.pendingTransactions = JSON.parse(
          pendingTxData
        ).map((txData) => Transaction.fromJSON(txData));
      }
    } catch (error) {
      console.log(
        "从数据库加载失败，使用默认数据:",
        error.message
      );
    }
  }
}

module.exports = Blockchain;
