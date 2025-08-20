const express = require("express");
const router = express.Router();
const Blockchain = require("../blockchain/Blockchain");
const Transaction = require("../blockchain/Transaction");
const Wallet = require("../blockchain/Wallet");
const CosmosClient = require("../cosmos/CosmosClient");

// 初始化区块链和Cosmos客户端实例
const blockchain = new Blockchain();
const cosmosClient = new CosmosClient();

// 初始化Cosmos客户端连接
cosmosClient.initialize().catch(console.error);

/**
 * 获取区块链状态
 * GET /api/blockchain/status
 * 返回区块链的统计信息，包括链长度、待处理交易数等
 */
router.get("/status", (req, res) => {
  try {
    const stats = blockchain.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取所有区块
 * GET /api/blockchain/blocks
 * 返回区块链中所有区块的JSON表示
 */
router.get("/blocks", (req, res) => {
  try {
    const blocks = blockchain.getAllBlocks();
    res.json({
      success: true,
      data: blocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取特定区块
 * GET /api/blockchain/blocks/:hash
 * 根据区块哈希值获取特定区块的详细信息
 */
router.get("/blocks/:hash", (req, res) => {
  try {
    const block = blockchain.getBlock(req.params.hash);
    if (!block) {
      return res.status(404).json({
        success: false,
        error: "区块未找到",
      });
    }
    res.json({
      success: true,
      data: block.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 执行挖矿
 * POST /api/blockchain/mine
 * 处理待处理交易并创建新区块
 */
router.post("/mine", async (req, res) => {
  try {
    const { minerAddress } = req.body;

    // 验证挖矿地址参数
    if (!minerAddress) {
      return res.status(400).json({
        success: false,
        error: "挖矿地址是必需的",
      });
    }

    // 执行挖矿操作
    const block = await blockchain.minePendingTransactions(
      minerAddress
    );

    res.json({
      success: true,
      message: "挖矿成功",
      data: {
        block: block.toJSON(),
        reward: blockchain.miningReward,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取地址余额
 * GET /api/blockchain/balance/:address
 * 计算并返回指定地址的当前余额
 */
router.get("/balance/:address", (req, res) => {
  try {
    const balance = blockchain.getBalanceOfAddress(
      req.params.address
    );
    res.json({
      success: true,
      data: {
        address: req.params.address,
        balance: balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 创建新钱包
 * POST /api/blockchain/wallet
 * 生成新的钱包密钥对和地址
 */
router.post("/wallet", (req, res) => {
  try {
    const wallet = blockchain.createWallet();
    res.json({
      success: true,
      data: wallet.getInfo(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取钱包信息
 * GET /api/blockchain/wallet/:address
 * 获取指定地址钱包的详细信息（包含余额）
 */
router.get("/wallet/:address", (req, res) => {
  try {
    const wallet = blockchain.getWallet(req.params.address);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "钱包未找到",
      });
    }

    // 计算钱包余额
    const balance = blockchain.getBalanceOfAddress(
      req.params.address
    );
    const walletInfo = wallet.getInfo();
    walletInfo.balance = balance;

    res.json({
      success: true,
      data: walletInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 创建交易 - 安全版本
 * POST /api/blockchain/transactions
 * 接收已签名的交易，而不是私钥，提高安全性
 */
router.post("/transactions", (req, res) => {
  try {
    const {
      fromAddress,
      toAddress,
      amount,
      signature,
      transactionHash,
    } = req.body;

    // 验证所有必需参数
    if (
      !fromAddress ||
      !toAddress ||
      !amount ||
      !signature ||
      !transactionHash
    ) {
      return res.status(400).json({
        success: false,
        error: "所有字段都是必需的",
      });
    }

    // 创建交易对象
    const transaction = new Transaction(
      fromAddress,
      toAddress,
      amount
    );

    // 设置预计算的哈希和签名
    transaction.hash = transactionHash;
    transaction.signature = signature;

    // 验证交易签名
    if (!transaction.isValid()) {
      return res.status(400).json({
        success: false,
        error: "交易签名无效",
      });
    }

    // 添加到区块链
    blockchain.addTransaction(transaction);

    res.json({
      success: true,
      message: "交易已创建",
      data: transaction.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取待签名交易数据
 * POST /api/blockchain/transactions/prepare
 * 创建交易对象并返回交易哈希，供客户端签名
 */
router.post("/transactions/prepare", (req, res) => {
  try {
    const { fromAddress, toAddress, amount } = req.body;

    // 验证必需参数
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: "发送方地址、接收方地址和金额是必需的",
      });
    }

    // 创建交易对象（不签名）
    const transaction = new Transaction(
      fromAddress,
      toAddress,
      amount
    );

    res.json({
      success: true,
      data: {
        transactionHash: transaction.hash,
        transactionData: {
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          type: transaction.type,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 获取所有交易
 * GET /api/blockchain/transactions
 * 返回区块链中所有交易的JSON表示
 */
router.get("/transactions", (req, res) => {
  try {
    const transactions = blockchain.getAllTransactions();
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 铸造代币
 * POST /api/blockchain/mint
 * 创建新的代币并分配给指定地址
 */
router.post("/mint", (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    // 验证参数
    if (!toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: "接收地址和数量是必需的",
      });
    }

    // 执行代币铸造
    blockchain.mintTokens(toAddress, amount);

    res.json({
      success: true,
      message: "代币铸造成功",
      data: {
        toAddress,
        amount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
