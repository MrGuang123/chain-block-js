const crypto = require("crypto-js");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
  constructor(
    fromAddress,
    toAddress,
    amount,
    type = "transfer"
  ) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.type = type; // 'transfer', 'reward', 'mint'
    this.hash = this.calculateHash();
    this.signature = null;
  }

  // 计算交易哈希
  calculateHash() {
    return crypto
      .SHA256(
        this.fromAddress +
          this.toAddress +
          this.amount +
          this.timestamp +
          this.type
      )
      .toString();
  }

  // 签名交易
  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("您不能为其他钱包签名交易！");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  // 验证交易是否有效
  isValid() {
    // 挖矿奖励交易不需要签名
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("没有签名！");
    }

    const publicKey = ec.keyFromPublic(
      this.fromAddress,
      "hex"
    );
    return publicKey.verify(
      this.calculateHash(),
      this.signature
    );
  }

  // 转换为JSON对象
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

  // 从JSON对象创建交易
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

  // 创建挖矿奖励交易
  static createRewardTransaction(minerAddress, amount) {
    return new Transaction(
      null,
      minerAddress,
      amount,
      "reward"
    );
  }

  // 创建代币铸造交易
  static createMintTransaction(toAddress, amount) {
    return new Transaction(null, toAddress, amount, "mint");
  }
}

module.exports = Transaction;
