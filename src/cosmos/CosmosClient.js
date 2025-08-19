const {
  DirectSecp256k1Wallet,
} = require("@cosmjs/proto-signing");
const {
  SigningStargateClient,
  StargateClient,
} = require("@cosmjs/stargate");
const { coins } = require("@cosmjs/amino");

class CosmosClient {
  constructor(
    rpcUrl = "https://cosmos-rpc.publicnode.com"
  ) {
    this.rpcUrl = rpcUrl;
    this.client = null;
    this.signingClient = null;
    this.wallet = null;
  }

  // 初始化客户端
  async initialize() {
    try {
      this.client = await StargateClient.connect(
        this.rpcUrl
      );
      console.log("Cosmos客户端已连接");
      return true;
    } catch (error) {
      console.error("连接Cosmos网络失败:", error);
      return false;
    }
  }

  // 创建钱包
  async createWallet() {
    try {
      this.wallet = await DirectSecp256k1Wallet.generate();
      const [account] = await this.wallet.getAccounts();
      console.log("Cosmos钱包已创建:", account.address);
      return account;
    } catch (error) {
      console.error("创建Cosmos钱包失败:", error);
      throw error;
    }
  }

  // 从助记词恢复钱包
  async recoverWallet(mnemonic) {
    try {
      this.wallet =
        await DirectSecp256k1Wallet.fromMnemonic(mnemonic);
      const [account] = await this.wallet.getAccounts();
      console.log("Cosmos钱包已恢复:", account.address);
      return account;
    } catch (error) {
      console.error("恢复Cosmos钱包失败:", error);
      throw error;
    }
  }

  // 初始化签名客户端
  async initializeSigningClient() {
    if (!this.wallet) {
      throw new Error("请先创建或恢复钱包");
    }

    try {
      this.signingClient =
        await SigningStargateClient.connectWithSigner(
          this.rpcUrl,
          this.wallet
        );
      console.log("Cosmos签名客户端已初始化");
      return true;
    } catch (error) {
      console.error("初始化签名客户端失败:", error);
      throw error;
    }
  }

  // 获取账户信息
  async getAccount(address) {
    try {
      const account = await this.client.getAccount(address);
      return account;
    } catch (error) {
      console.error("获取账户信息失败:", error);
      return null;
    }
  }

  // 获取余额
  async getBalance(address, searchDenom = "uatom") {
    try {
      const balance = await this.client.getBalance(
        address,
        searchDenom
      );
      return balance;
    } catch (error) {
      console.error("获取余额失败:", error);
      return null;
    }
  }

  // 发送代币
  async sendTokens(toAddress, amount, denom = "uatom") {
    if (!this.signingClient) {
      throw new Error("请先初始化签名客户端");
    }

    try {
      const [account] = await this.wallet.getAccounts();
      const result = await this.signingClient.sendTokens(
        account.address,
        toAddress,
        coins(amount, denom),
        {
          gas: "200000",
          amount: coins(5000, "uatom"),
        }
      );
      console.log("代币发送成功:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("发送代币失败:", error);
      throw error;
    }
  }

  // 获取链状态
  async getChainStatus() {
    try {
      const status = await this.client.getStatus();
      return {
        nodeInfo: status.nodeInfo,
        syncInfo: status.syncInfo,
        validatorInfo: status.validatorInfo,
      };
    } catch (error) {
      console.error("获取链状态失败:", error);
      return null;
    }
  }

  // 获取最新区块
  async getLatestBlock() {
    try {
      const block = await this.client.getBlock();
      return block;
    } catch (error) {
      console.error("获取最新区块失败:", error);
      return null;
    }
  }

  // 获取区块高度
  async getBlockHeight() {
    try {
      const height = await this.client.getHeight();
      return height;
    } catch (error) {
      console.error("获取区块高度失败:", error);
      return null;
    }
  }

  // 获取交易
  async getTransaction(hash) {
    try {
      const tx = await this.client.getTx(hash);
      return tx;
    } catch (error) {
      console.error("获取交易失败:", error);
      return null;
    }
  }

  // 获取助记词
  async getMnemonic() {
    if (!this.wallet) {
      throw new Error("钱包未初始化");
    }
    return this.wallet.mnemonic;
  }

  // 获取钱包地址
  async getWalletAddress() {
    if (!this.wallet) {
      throw new Error("钱包未初始化");
    }
    const [account] = await this.wallet.getAccounts();
    return account.address;
  }

  // 关闭连接
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
    if (this.signingClient) {
      await this.signingClient.disconnect();
    }
    console.log("Cosmos客户端已断开连接");
  }
}

module.exports = CosmosClient;
