const Block = require("./Block");
const Transaction = require("./Transaction");
const Wallet = require("./Wallet");
const { Level } = require("level");

/**
 * 区块链类 - 区块链系统的核心控制器
 * 管理区块链、交易池、钱包、挖矿等核心功能
 */
class Blockchain {
  /**
   * 构造函数 - 初始化区块链
   * 创建创世区块、初始化数据存储、加载历史数据
   */
  constructor() {
    this.chain = [this.createGenesisBlock()]; // 区块链，包含创世区块
    this.difficulty = 4; // 挖矿难度（哈希前导零个数）
    this.pendingTransactions = []; // 待处理交易池
    this.miningReward = 100; // 挖矿奖励金额
    this.db = new Level("./data/blockchain"); // LevelDB数据库实例
    this.wallets = new Map(); // 钱包集合（地址 -> 钱包对象）
    this.loadFromDatabase(); // 从数据库加载历史数据
  }

  /**
   * 创建创世区块（第一个区块）
   * 创世区块没有前一个区块的哈希
   * @returns {Block} 创世区块
   */
  createGenesisBlock() {
    const genesisBlock = new Block(Date.now(), [], "0");
    genesisBlock.hash = genesisBlock.calculateHash();
    return genesisBlock;
  }

  /**
   * 获取最新的区块
   * @returns {Block} 区块链中的最后一个区块
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * 挖矿 - 处理待处理交易并创建新区块
   * 执行工作量证明算法，验证交易，更新余额
   * @param {string} miningRewardAddress - 挖矿奖励接收地址
   * @returns {Block} 新挖出的区块
   */
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

    // 执行工作量证明挖矿
    console.log("开始挖矿...");
    const startTime = Date.now();
    block.mineBlock();
    const endTime = Date.now();
    console.log(`挖矿完成，耗时: ${endTime - startTime}ms`);

    // 将新区块添加到区块链
    this.chain.push(block);

    // 重置待处理交易池
    this.pendingTransactions = [];

    // 更新所有钱包余额
    this.updateBalances();

    // 保存到数据库
    await this.saveToDatabase();

    return block;
  }

  /**
   * 添加交易到待处理交易池
   * 验证交易的有效性和发送方余额
   * @param {Transaction} transaction - 要添加的交易
   * @throws {Error} 如果交易无效或余额不足
   */
  addTransaction(transaction) {
    // 验证交易基本信息
    if (
      !transaction.fromAddress ||
      !transaction.toAddress
    ) {
      throw new Error("交易必须包含发送方和接收方地址！");
    }

    // 验证交易签名
    if (!transaction.isValid()) {
      throw new Error("无法添加无效交易到链上！");
    }

    // 验证交易金额
    if (transaction.amount <= 0) {
      throw new Error("交易金额必须大于0！");
    }

    // 检查发送方余额是否充足
    const senderBalance = this.getBalanceOfAddress(
      transaction.fromAddress
    );
    if (senderBalance < transaction.amount) {
      throw new Error("余额不足！");
    }

    // 添加到待处理交易池
    this.pendingTransactions.push(transaction);
    console.log("交易已添加到待处理队列");
  }

  /**
   * 计算指定地址的余额
   * 遍历所有区块的所有交易来计算余额
   * @param {string} address - 要查询的地址
   * @returns {number} 地址的当前余额
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    // 遍历区块链中的所有区块
    for (const block of this.chain) {
      // 遍历区块中的所有交易
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount; // 发送方减少余额
        }

        if (trans.toAddress === address) {
          balance += trans.amount; // 接收方增加余额
        }
      }
    }

    return balance;
  }

  /**
   * 验证整个区块链的有效性
   * 检查区块哈希、链接关系、交易签名等
   * @returns {boolean} 区块链有效返回true，否则返回false
   */
  isChainValid() {
    // 从第二个区块开始验证（第一个是创世区块）
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 验证当前区块的哈希值是否正确
      if (
        currentBlock.hash !== currentBlock.calculateHash()
      ) {
        return false;
      }

      // 验证区块链接关系
      if (
        currentBlock.previousHash !== previousBlock.hash
      ) {
        return false;
      }

      // 验证区块中的交易是否有效
      if (!currentBlock.hasValidTransactions()) {
        return false;
      }
    }
    return true;
  }

  /**
   * 创建新钱包
   * @returns {Wallet} 新创建的钱包
   */
  createWallet() {
    const wallet = Wallet.createWallet();
    this.wallets.set(wallet.getAddress(), wallet);
    return wallet;
  }

  /**
   * 根据地址获取钱包
   * @param {string} address - 钱包地址
   * @returns {Wallet|null} 钱包对象，如果不存在返回null
   */
  getWallet(address) {
    return this.wallets.get(address);
  }

  /**
   * 更新所有钱包的余额
   * 根据区块链中的交易重新计算每个钱包的余额
   */
  updateBalances() {
    for (const [address, wallet] of this.wallets) {
      wallet.balance = this.getBalanceOfAddress(address);
    }
  }

  /**
   * 铸造代币（创建新代币）
   * @param {string} toAddress - 接收代币的地址
   * @param {number} amount - 铸造的代币数量
   */
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

  /**
   * 获取区块链统计信息
   * @returns {Object} 包含区块链各种统计数据的对象
   */
  getStats() {
    return {
      chainLength: this.chain.length, // 区块链长度
      pendingTransactions: this.pendingTransactions.length, // 待处理交易数量
      totalWallets: this.wallets.size, // 钱包总数
      difficulty: this.difficulty, // 当前挖矿难度
      miningReward: this.miningReward, // 挖矿奖励
      isValid: this.isChainValid(), // 区块链是否有效
    };
  }

  /**
   * 获取所有区块的JSON表示
   * @returns {Array} 区块数组
   */
  getAllBlocks() {
    return this.chain.map((block) => block.toJSON());
  }

  /**
   * 根据哈希值获取特定区块
   * @param {string} hash - 区块哈希值
   * @returns {Block|null} 区块对象，如果不存在返回null
   */
  getBlock(hash) {
    return this.chain.find((block) => block.hash === hash);
  }

  /**
   * 获取所有交易的JSON表示
   * @returns {Array} 交易数组
   */
  getAllTransactions() {
    const transactions = [];
    for (const block of this.chain) {
      transactions.push(...block.transactions);
    }
    return transactions.map((tx) => tx.toJSON());
  }

  /**
   * 保存区块链数据到数据库
   * 包括区块链、钱包、待处理交易等
   */
  async saveToDatabase() {
    try {
      // 保存区块链数据
      await this.db.put(
        "chain",
        JSON.stringify(
          this.chain.map((block) => block.toJSON())
        )
      );

      // 保存钱包数据
      await this.db.put(
        "wallets",
        JSON.stringify(Array.from(this.wallets.entries()))
      );

      // 保存待处理交易数据
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

  /**
   * 从数据库加载区块链数据
   * 包括区块链、钱包、待处理交易等
   */
  async loadFromDatabase() {
    try {
      // 加载区块链数据
      const chainData = await this.db.get("chain");
      if (chainData) {
        this.chain = JSON.parse(chainData).map(
          (blockData) => Block.fromJSON(blockData)
        );
      }

      // 加载钱包数据
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

      // 加载待处理交易数据
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
