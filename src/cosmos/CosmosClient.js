const {
  DirectSecp256k1Wallet,
} = require("@cosmjs/proto-signing");
const {
  SigningStargateClient,
  StargateClient,
} = require("@cosmjs/stargate");
const { coins } = require("@cosmjs/amino");

/**
 * Cosmos客户端类 - 与Cosmos网络交互的核心组件
 * 提供钱包管理、交易发送、网络状态查询等功能
 */
class CosmosClient {
  /**
   * 构造函数 - 初始化Cosmos客户端
   * @param {string} rpcUrl - Cosmos RPC节点URL，如果为null则使用默认节点列表
   */
  constructor(rpcUrl = null) {
    // 多个备用RPC节点，按优先级排序
    this.rpcEndpoints = [
      rpcUrl, // 用户指定的RPC节点
      "https://rpc.cosmos.network:26657", // 官方RPC节点
      "https://cosmos-rpc.polkachu.com", // Polkachu节点
      "https://cosmos-rpc.allthatnode.com", // AllThatNode节点
      "https://rpc.ankr.com/cosmos", // Ankr节点
      "https://cosmos-rpc.publicnode.com", // PublicNode节点（备用）
    ].filter(Boolean); // 过滤掉空值

    this.rpcUrl = this.rpcEndpoints[0]; // 当前使用的RPC节点
    this.currentEndpointIndex = 0; // 当前节点在列表中的索引
    this.client = null; // Stargate客户端实例
    this.signingClient = null; // 签名客户端实例
    this.wallet = null; // 钱包实例
  }

  /**
   * 初始化客户端连接（带重试机制）
   * 依次尝试连接多个RPC节点，直到成功连接
   * @returns {boolean} 连接成功返回true，否则返回false
   */
  async initialize() {
    for (let i = 0; i < this.rpcEndpoints.length; i++) {
      try {
        this.rpcUrl = this.rpcEndpoints[i];
        this.currentEndpointIndex = i;
        console.log(`尝试连接到: ${this.rpcUrl}`);

        // 创建Stargate客户端连接
        this.client = await StargateClient.connect(
          this.rpcUrl
        );

        // 测试连接是否有效（获取区块高度）
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

        // 如果是最后一个节点，返回失败
        if (i === this.rpcEndpoints.length - 1) {
          console.error("❌ 所有RPC节点连接失败");
          return false;
        }

        // 等待1秒后重试下一个节点
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }
    }
  }

  /**
   * 切换到下一个RPC节点
   * 当当前节点不可用时，可以手动切换到备用节点
   * @returns {boolean} 切换成功返回true，否则返回false
   */
  async switchToNextEndpoint() {
    this.currentEndpointIndex =
      (this.currentEndpointIndex + 1) %
      this.rpcEndpoints.length;
    this.rpcUrl =
      this.rpcEndpoints[this.currentEndpointIndex];

    try {
      this.client = await StargateClient.connect(
        this.rpcUrl
      );
      console.log(`已切换到RPC节点: ${this.rpcUrl}`);
      return true;
    } catch (error) {
      console.error(`切换节点失败: ${this.rpcUrl}`, error);
      return false;
    }
  }

  /**
   * 获取当前RPC节点信息
   * @returns {Object} 包含当前节点信息的对象
   */
  getCurrentEndpoint() {
    return {
      url: this.rpcUrl,
      index: this.currentEndpointIndex,
      total: this.rpcEndpoints.length,
    };
  }

  /**
   * 创建新的Cosmos钱包
   * 生成新的助记词和密钥对
   * @returns {Object} 包含地址和公钥的账户对象
   */
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

  /**
   * 从助记词恢复钱包
   * @param {string} mnemonic - 12或24个单词的助记词
   * @returns {Object} 包含地址和公钥的账户对象
   */
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

  /**
   * 初始化签名客户端
   * 用于发送交易和签名操作
   * @returns {boolean} 初始化成功返回true，否则抛出错误
   */
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

  /**
   * 获取账户信息
   * @param {string} address - 要查询的账户地址
   * @returns {Object|null} 账户信息对象，如果不存在返回null
   */
  async getAccount(address) {
    try {
      const account = await this.client.getAccount(address);
      return account;
    } catch (error) {
      console.error("获取账户信息失败:", error);
      return null;
    }
  }

  /**
   * 获取账户余额
   * @param {string} address - 要查询的账户地址
   * @param {string} searchDenom - 代币类型，默认为uatom
   * @returns {Object|null} 余额信息对象，如果不存在返回null
   */
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

  /**
   * 发送代币
   * @param {string} toAddress - 接收方地址
   * @param {string} amount - 发送金额
   * @param {string} denom - 代币类型，默认为uatom
   * @returns {Object} 交易结果对象
   */
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
          gas: "200000", // 设置gas限制
          amount: coins(5000, "uatom"), // 设置gas费用
        }
      );
      console.log("代币发送成功:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("发送代币失败:", error);
      throw error;
    }
  }

  /**
   * 获取链状态信息
   * @returns {Object|null} 包含节点信息、同步状态、验证者信息的对象
   */
  async getChainStatus() {
    try {
      const status = await this.client.getStatus();
      return {
        nodeInfo: status.nodeInfo, // 节点信息
        syncInfo: status.syncInfo, // 同步信息
        validatorInfo: status.validatorInfo, // 验证者信息
      };
    } catch (error) {
      console.error("获取链状态失败:", error);
      return null;
    }
  }

  /**
   * 获取最新区块信息
   * @returns {Object|null} 最新区块对象，如果获取失败返回null
   */
  async getLatestBlock() {
    try {
      const block = await this.client.getBlock();
      return block;
    } catch (error) {
      console.error("获取最新区块失败:", error);
      return null;
    }
  }

  /**
   * 获取当前区块高度
   * @returns {number|null} 区块高度，如果获取失败返回null
   */
  async getBlockHeight() {
    try {
      const height = await this.client.getHeight();
      return height;
    } catch (error) {
      console.error("获取区块高度失败:", error);
      return null;
    }
  }

  /**
   * 根据交易哈希获取交易信息
   * @param {string} hash - 交易哈希
   * @returns {Object|null} 交易信息对象，如果不存在返回null
   */
  async getTransaction(hash) {
    try {
      const tx = await this.client.getTx(hash);
      return tx;
    } catch (error) {
      console.error("获取交易失败:", error);
      return null;
    }
  }

  /**
   * 获取钱包助记词
   * @returns {string} 12或24个单词的助记词
   */
  async getMnemonic() {
    if (!this.wallet) {
      throw new Error("钱包未初始化");
    }
    return this.wallet.mnemonic;
  }

  /**
   * 获取钱包地址
   * @returns {string} 钱包地址
   */
  async getWalletAddress() {
    if (!this.wallet) {
      throw new Error("钱包未初始化");
    }
    const [account] = await this.wallet.getAccounts();
    return account.address;
  }

  /**
   * 网络诊断功能
   * 测试所有RPC节点的连接状态和响应时间
   * @returns {Object} 诊断结果对象
   */
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

  /**
   * 获取连接状态信息
   * @returns {Object} 包含当前连接状态的对象
   */
  getConnectionStatus() {
    return {
      currentEndpoint: this.rpcUrl,
      isConnected: !!this.client,
      availableEndpoints: this.rpcEndpoints,
    };
  }

  /**
   * 关闭所有连接
   * 释放资源并断开与RPC节点的连接
   */
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
