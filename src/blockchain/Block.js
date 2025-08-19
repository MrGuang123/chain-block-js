const crypto = require("crypto-js");
const Transaction = require("./Transaction");

class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
    this.difficulty = 4; // 挖矿难度
  }

  // 计算区块哈希
  calculateHash() {
    return crypto
      .SHA256(
        this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .toString();
  }

  // 挖矿 - 工作量证明
  mineBlock() {
    const target = Array(this.difficulty + 1).join("0");

    while (
      this.hash.substring(0, this.difficulty) !== target
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`区块已挖出: ${this.hash}`);
    return this.hash;
  }

  // 验证区块是否有效
  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }

  // 转换为JSON对象
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

  // 从JSON对象创建区块
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
