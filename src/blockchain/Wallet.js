const EC = require("elliptic").ec;
const crypto = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

/**
 * 钱包类 - 管理用户的密钥对和地址
 * 提供密钥生成、签名验证、余额管理等功能
 */
class Wallet {
  /**
   * 构造函数 - 创建新钱包
   * 自动生成椭圆曲线密钥对和唯一标识符
   */
  constructor() {
    this.ec = new EC("secp256k1"); // 使用secp256k1椭圆曲线算法
    this.key = this.ec.genKeyPair(); // 生成新的密钥对
    this.address = this.key.getPublic("hex"); // 公钥作为钱包地址
    this.balance = 0; // 初始余额为0
    this.id = uuidv4(); // 生成唯一钱包ID
    this.createdAt = Date.now(); // 钱包创建时间
  }

  /**
   * 获取钱包地址（公钥）
   * @returns {string} 钱包地址
   */
  getAddress() {
    return this.address;
  }

  /**
   * 获取私钥（用于交易签名）
   * 注意：私钥应该安全保存，不要泄露
   * @returns {string} 私钥的十六进制表示
   */
  getPrivateKey() {
    return this.key.getPrivate("hex");
  }

  /**
   * 获取公钥
   * @returns {string} 公钥的十六进制表示
   */
  getPublicKey() {
    return this.key.getPublic("hex");
  }

  /**
   * 使用私钥对数据进行签名
   * @param {string} data - 要签名的数据
   * @returns {string} 数字签名的十六进制表示
   */
  sign(data) {
    const hash = crypto.SHA256(data).toString(); // 先对数据进行SHA256哈希
    const signature = this.key.sign(hash); // 使用私钥签名
    return signature.toDER("hex"); // 返回DER格式的签名
  }

  /**
   * 验证数字签名
   * @param {string} data - 原始数据
   * @param {string} signature - 数字签名
   * @returns {boolean} 签名有效返回true，否则返回false
   */
  verify(data, signature) {
    const hash = crypto.SHA256(data).toString(); // 计算数据的哈希值
    return this.key.verify(hash, signature); // 验证签名
  }

  /**
   * 更新钱包余额
   * @param {number} amount - 要更新的金额（正数增加，负数减少）
   * @throws {Error} 如果余额不足则抛出错误
   */
  updateBalance(amount) {
    this.balance += amount;
    if (this.balance < 0) {
      throw new Error("余额不足！");
    }
  }

  /**
   * 获取钱包信息（不包含私钥）
   * @returns {Object} 钱包信息对象
   */
  getInfo() {
    return {
      id: this.id,
      address: this.address,
      balance: this.balance,
      publicKey: this.getPublicKey(),
      createdAt: this.createdAt,
    };
  }

  /**
   * 将钱包转换为JSON对象（包含私钥）
   * 注意：包含私钥的JSON应该安全保存
   * @returns {Object} 钱包的完整JSON表示
   */
  toJSON() {
    return {
      id: this.id,
      address: this.address,
      balance: this.balance,
      publicKey: this.getPublicKey(),
      privateKey: this.getPrivateKey(), // 包含私钥，需要安全保存
      createdAt: this.createdAt,
    };
  }

  /**
   * 从JSON对象创建钱包实例
   * @param {Object} json - 钱包的JSON数据
   * @returns {Wallet} 钱包实例
   */
  static fromJSON(json) {
    const wallet = new Wallet();
    wallet.id = json.id;
    wallet.address = json.address;
    wallet.balance = json.balance;
    wallet.createdAt = json.createdAt;

    // 从私钥重新创建密钥对
    wallet.key = wallet.ec.keyFromPrivate(
      json.privateKey,
      "hex"
    );

    return wallet;
  }

  /**
   * 创建新钱包（静态方法）
   * @returns {Wallet} 新创建的钱包实例
   */
  static createWallet() {
    return new Wallet();
  }

  /**
   * 从私钥恢复钱包
   * @param {string} privateKey - 私钥的十六进制表示
   * @returns {Wallet} 恢复的钱包实例
   */
  static fromPrivateKey(privateKey) {
    const wallet = new Wallet();
    wallet.key = wallet.ec.keyFromPrivate(
      privateKey,
      "hex"
    );
    wallet.address = wallet.key.getPublic("hex"); // 从私钥计算公钥地址
    return wallet;
  }
}

module.exports = Wallet;
