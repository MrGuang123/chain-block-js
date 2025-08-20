const {
  DirectSecp256k1Wallet,
} = require("@cosmjs/proto-signing");
const {
  SigningStargateClient,
  StargateClient,
} = require("@cosmjs/stargate");
const { coins } = require("@cosmjs/amino");

class CosmosClient {
  constructor(rpcUrl = null) {
    // 多个备用RPC节点
    this.rpcEndpoints = [
      rpcUrl,
      "https://rpc.cosmos.network:26657",
      "https://cosmos-rpc.polkachu.com",
      "https://cosmos-rpc.allthatnode.com",
      "https://rpc.ankr.com/cosmos",
      "https://cosmos-rpc.publicnode.com", // 作为最后的备选
    ].filter(Boolean);

    this.rpcUrl = this.rpcEndpoints[0];
    this.client = null;
    this.signingClient = null;
    this.wallet = null;
  }

  // 初始化客户端（带重试机制）
  async initialize() {
    for (let i = 0; i < this.rpcEndpoints.length; i++) {
      try {
        this.rpcUrl = this.rpcEndpoints[i];
        console.log(`尝试连接到: ${this.rpcUrl}`);

        this.client = await StargateClient.connect(
          this.rpcUrl
        );

        // 测试连接是否有效
        await this.client.getHeight();

        console.log(
          `✅ Cosmos客户端已连接到: ${this.rpcUrl}`
        );
        return true;
      } catch (error) {
        console.error(
          `❌ 连接失败 ${this.rpcUrl}:`,
          error.message
        );

        if (i === this.rpcEndpoints.length - 1) {
          console.error("❌ 所有RPC节点连接失败");
          return false;
        }

        // 等待1秒后重试
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }
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

  // 网络诊断
  async diagnoseConnection() {
    console.log("🔍 开始网络诊断...");

    for (let i = 0; i < this.rpcEndpoints.length; i++) {
      const endpoint = this.rpcEndpoints[i];
      console.log(`\n📡 测试节点 ${i + 1}: ${endpoint}`);

      try {
        // 测试基本连接
        const startTime = Date.now();
        const client = await StargateClient.connect(
          endpoint
        );
        const connectTime = Date.now() - startTime;

        // 测试API调用
        const height = await client.getHeight();
        const apiTime = Date.now() - startTime;

        console.log(
          `✅ 连接成功 - 延迟: ${connectTime}ms, API响应: ${apiTime}ms`
        );
        console.log(`📊 当前区块高度: ${height}`);

        await client.disconnect();

        // 如果这个节点可用，设置为当前节点
        this.rpcUrl = endpoint;
        return {
          success: true,
          endpoint: endpoint,
          connectTime: connectTime,
          apiTime: apiTime,
          height: height,
        };
      } catch (error) {
        console.log(`❌ 连接失败: ${error.message}`);

        // 分析错误类型
        if (error.message.includes("timeout")) {
          console.log("⏰ 超时错误 - 网络延迟过高");
        } else if (error.message.includes("ENOTFOUND")) {
          console.log("🌐 DNS解析失败 - 检查网络连接");
        } else if (error.message.includes("ECONNREFUSED")) {
          console.log("🚫 连接被拒绝 - 服务可能不可用");
        } else {
          console.log("❓ 未知错误");
        }
      }
    }

    return {
      success: false,
      error: "所有节点都无法连接",
    };
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      currentEndpoint: this.rpcUrl,
      isConnected: !!this.client,
      availableEndpoints: this.rpcEndpoints,
    };
  }
}

module.exports = CosmosClient;
