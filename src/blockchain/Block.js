const crypto = require("crypto-js");
const Transaction = require("./Transaction");

/**
 * 区块类 - 区块链的基本数据结构
 * 每个区块包含交易数据、时间戳、哈希值等信息
 */
class Block {
  /**
   * 构造函数 - 创建新区块
   * @param {number} timestamp - 区块创建时间戳
   * @param {Array} transactions - 交易数组
   * @param {string} previousHash - 前一个区块的哈希值
   */
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp; // 区块创建时间戳
    this.transactions = transactions; // 区块包含的交易列表
    this.previousHash = previousHash; // 前一个区块的哈希值（用于链接）
    this.hash = this.calculateHash(); // 当前区块的哈希值
    this.nonce = 0; // 挖矿随机数（用于工作量证明）
    this.difficulty = 4; // 挖矿难度（哈希值前导零的个数）
  }

  /**
   * 计算区块哈希值
   * 使用SHA256算法对区块数据进行哈希计算
   * @returns {string} 区块的哈希值
   */
  calculateHash() {
    return crypto
      .SHA256(
        this.previousHash + // 前一个区块哈希
          this.timestamp + // 时间戳
          JSON.stringify(this.transactions) + // 交易数据（JSON字符串）
          this.nonce // 随机数
      )
      .toString();
  }

  /**
   * 挖矿 - 工作量证明算法
   * 通过不断改变nonce值，找到满足难度要求的哈希值
   * @returns {string} 找到的有效哈希值
   */
  mineBlock() {
    // 创建目标字符串：前difficulty个字符为0
    const target = Array(this.difficulty + 1).join("0");

    // 不断尝试不同的nonce值，直到找到满足条件的哈希
    while (
      this.hash.substring(0, this.difficulty) !== target
    ) {
      this.nonce++; // 增加随机数
      this.hash = this.calculateHash(); // 重新计算哈希值
    }

    console.log(`区块已挖出: ${this.hash}`);
    return this.hash;
  }

  /**
   * 验证区块中的交易是否有效
   * 检查区块中所有交易的签名是否正确
   * @returns {boolean} 所有交易都有效返回true，否则返回false
   */
  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }

  /**
   * 将区块转换为JSON对象
   * 用于数据序列化和API响应
   * @returns {Object} 区块的JSON表示
   */
  toJSON() {
    return {
      timestamp: this.timestamp,
      transactions: this.transactions.map((tx) =>
        tx.toJSON()
      ),
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
      difficulty: this.difficulty,
    };
  }

  /**
   * 从JSON对象创建区块实例
   * 用于数据反序列化
   * @param {Object} json - 区块的JSON数据
   * @returns {Block} 区块实例
   */
  static fromJSON(json) {
    const block = new Block(
      json.timestamp,
      json.transactions.map((tx) =>
        Transaction.fromJSON(tx)
      ),
      json.previousHash
    );
    block.hash = json.hash;
    block.nonce = json.nonce;
    block.difficulty = json.difficulty;
    return block;
  }
}

module.exports = Block;
