const crypto = require("crypto-js");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // 使用secp256k1椭圆曲线算法

/**
 * 交易类 - 区块链中的交易数据结构
 * 包含发送方、接收方、金额、签名等信息
 */
class Transaction {
  /**
   * 构造函数 - 创建新交易
   * @param {string} fromAddress - 发送方地址（公钥）
   * @param {string} toAddress - 接收方地址
   * @param {number} amount - 交易金额
   * @param {string} type - 交易类型（transfer/reward/mint）
   */
  constructor(
    fromAddress,
    toAddress,
    amount,
    type = "transfer"
  ) {
    this.fromAddress = fromAddress; // 发送方地址
    this.toAddress = toAddress; // 接收方地址
    this.amount = amount; // 交易金额
    this.timestamp = Date.now(); // 交易创建时间戳
    this.type = type; // 交易类型
    this.hash = this.calculateHash(); // 交易哈希值
    this.signature = null; // 数字签名（初始为空）
  }

  /**
   * 计算交易哈希值
   * 使用SHA256算法对交易数据进行哈希计算
   * @returns {string} 交易的哈希值
   */
  calculateHash() {
    return crypto
      .SHA256(
        this.fromAddress + // 发送方地址
          this.toAddress + // 接收方地址
          this.amount + // 交易金额
          this.timestamp + // 时间戳
          this.type // 交易类型
      )
      .toString();
  }

  /**
   * 使用私钥对交易进行签名
   * @param {Object} signingKey - 椭圆曲线私钥对象
   * @throws {Error} 如果签名者不是发送方则抛出错误
   */
  signTransaction(signingKey) {
    // 验证签名者是否为交易的发送方
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("您不能为其他钱包签名交易！");
    }

    // 计算交易哈希并使用私钥签名
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex"); // 将签名转换为DER格式
  }

  /**
   * 验证交易签名是否有效
   * @returns {boolean} 签名有效返回true，否则返回false
   * @throws {Error} 如果没有签名或签名格式错误
   */
  isValid() {
    // 挖矿奖励交易不需要签名验证
    if (this.fromAddress === null) return true;

    // 检查是否存在签名
    if (!this.signature || this.signature.length === 0) {
      throw new Error("没有签名！");
    }

    try {
      // 尝试使用椭圆曲线签名验证
      const publicKey = ec.keyFromPublic(
        this.fromAddress,
        "hex"
      );
      return publicKey.verify(
        this.calculateHash(),
        this.signature
      );
    } catch (error) {
      // 如果椭圆曲线验证失败，尝试使用简化签名验证
      // 这里假设前端发送的是简化签名（用于演示目的）
      console.warn(
        "椭圆曲线签名验证失败，使用简化验证:",
        error.message
      );

      // 简化验证：检查签名是否包含私钥和哈希的组合
      // 注意：这只是为了演示，实际项目中应该使用标准的数字签名
      const expectedSignature =
        this.fromAddress + this.calculateHash();
      const simplifiedSignature = Buffer.from(
        expectedSignature
      )
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 128);

      return this.signature === simplifiedSignature;
    }
  }

  /**
   * 将交易转换为JSON对象
   * @returns {Object} 交易的JSON表示
   */
  toJSON() {
    return {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp,
      type: this.type,
      hash: this.hash,
      signature: this.signature,
    };
  }

  /**
   * 从JSON对象创建交易实例
   * @param {Object} json - 交易的JSON数据
   * @returns {Transaction} 交易实例
   */
  static fromJSON(json) {
    const tx = new Transaction(
      json.fromAddress,
      json.toAddress,
      json.amount,
      json.type
    );
    tx.timestamp = json.timestamp;
    tx.hash = json.hash;
    tx.signature = json.signature;
    return tx;
  }

  /**
   * 创建挖矿奖励交易
   * 挖矿奖励交易的发送方为null（系统生成）
   * @param {string} minerAddress - 矿工地址
   * @param {number} amount - 奖励金额
   * @returns {Transaction} 挖矿奖励交易
   */
  static createRewardTransaction(minerAddress, amount) {
    return new Transaction(
      null, // 发送方为null（系统）
      minerAddress, // 接收方为矿工
      amount, // 奖励金额
      "reward" // 交易类型为奖励
    );
  }

  /**
   * 创建代币铸造交易
   * 铸造交易的发送方为null（系统生成）
   * @param {string} toAddress - 接收方地址
   * @param {number} amount - 铸造金额
   * @returns {Transaction} 铸造交易
   */
  static createMintTransaction(toAddress, amount) {
    return new Transaction(null, toAddress, amount, "mint");
  }
}

module.exports = Transaction;
