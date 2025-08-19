const EC = require("elliptic").ec;
const crypto = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

class Wallet {
  constructor() {
    this.ec = new EC("secp256k1");
    this.key = this.ec.genKeyPair();
    this.address = this.key.getPublic("hex");
    this.balance = 0;
    this.id = uuidv4();
    this.createdAt = Date.now();
  }

  // 获取钱包地址
  getAddress() {
    return this.address;
  }

  // 获取私钥（用于签名）
  getPrivateKey() {
    return this.key.getPrivate("hex");
  }

  // 获取公钥
  getPublicKey() {
    return this.key.getPublic("hex");
  }

  // 签名数据
  sign(data) {
    const hash = crypto.SHA256(data).toString();
    const signature = this.key.sign(hash);
    return signature.toDER("hex");
  }

  // 验证签名
  verify(data, signature) {
    const hash = crypto.SHA256(data).toString();
    return this.key.verify(hash, signature);
  }

  // 更新余额
  updateBalance(amount) {
    this.balance += amount;
    if (this.balance < 0) {
      throw new Error("余额不足！");
    }
  }

  // 获取钱包信息
  getInfo() {
    return {
      id: this.id,
      address: this.address,
      balance: this.balance,
      publicKey: this.getPublicKey(),
      createdAt: this.createdAt,
    };
  }

  // 转换为JSON对象
  toJSON() {
    return {
      id: this.id,
      address: this.address,
      balance: this.balance,
      publicKey: this.getPublicKey(),
      privateKey: this.getPrivateKey(),
      createdAt: this.createdAt,
    };
  }

  // 从JSON对象创建钱包
  static fromJSON(json) {
    const wallet = new Wallet();
    wallet.id = json.id;
    wallet.address = json.address;
    wallet.balance = json.balance;
    wallet.createdAt = json.createdAt;

    // 重新创建密钥对
    wallet.key = wallet.ec.keyFromPrivate(
      json.privateKey,
      "hex"
    );

    return wallet;
  }

  // 创建钱包（不保存私钥）
  static createWallet() {
    return new Wallet();
  }

  // 从私钥恢复钱包
  static fromPrivateKey(privateKey) {
    const wallet = new Wallet();
    wallet.key = wallet.ec.keyFromPrivate(
      privateKey,
      "hex"
    );
    wallet.address = wallet.key.getPublic("hex");
    return wallet;
  }
}

module.exports = Wallet;
