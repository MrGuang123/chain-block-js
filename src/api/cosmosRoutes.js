const express = require("express");
const router = express.Router();
const CosmosClient = require("../cosmos/CosmosClient");

// 初始化Cosmos客户端
const cosmosClient = new CosmosClient();

// 初始化连接
cosmosClient.initialize().catch(console.error);

// 获取Cosmos网络状态
router.get("/status", async (req, res) => {
  try {
    const status = await cosmosClient.getChainStatus();
    if (!status) {
      return res.status(500).json({
        success: false,
        error: "无法获取Cosmos网络状态",
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 创建Cosmos钱包
router.post("/wallet", async (req, res) => {
  try {
    const account = await cosmosClient.createWallet();
    const mnemonic = await cosmosClient.getMnemonic();

    res.json({
      success: true,
      data: {
        address: account.address,
        pubkey: account.pubkey,
        mnemonic: mnemonic,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 从助记词恢复钱包
router.post("/wallet/recover", async (req, res) => {
  try {
    const { mnemonic } = req.body;

    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        error: "助记词是必需的",
      });
    }

    const account = await cosmosClient.recoverWallet(
      mnemonic
    );

    res.json({
      success: true,
      data: {
        address: account.address,
        pubkey: account.pubkey,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取账户信息
router.get("/account/:address", async (req, res) => {
  try {
    const account = await cosmosClient.getAccount(
      req.params.address
    );
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "账户未找到",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取余额
router.get("/balance/:address", async (req, res) => {
  try {
    const { denom = "uatom" } = req.query;
    const balance = await cosmosClient.getBalance(
      req.params.address,
      denom
    );

    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "余额未找到",
      });
    }

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 发送代币
router.post("/send", async (req, res) => {
  try {
    const {
      toAddress,
      amount,
      denom = "uatom",
      mnemonic,
    } = req.body;

    if (!toAddress || !amount || !mnemonic) {
      return res.status(400).json({
        success: false,
        error: "接收地址、数量和助记词都是必需的",
      });
    }

    // 恢复钱包
    await cosmosClient.recoverWallet(mnemonic);

    // 初始化签名客户端
    await cosmosClient.initializeSigningClient();

    // 发送代币
    const result = await cosmosClient.sendTokens(
      toAddress,
      amount,
      denom
    );

    res.json({
      success: true,
      message: "代币发送成功",
      data: {
        transactionHash: result.transactionHash,
        height: result.height,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取最新区块
router.get("/blocks/latest", async (req, res) => {
  try {
    const block = await cosmosClient.getLatestBlock();
    if (!block) {
      return res.status(500).json({
        success: false,
        error: "无法获取最新区块",
      });
    }

    res.json({
      success: true,
      data: {
        height: block.header.height,
        hash: block.id,
        timestamp: block.header.time,
        numTxs: block.header.numTxs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取区块高度
router.get("/blocks/height", async (req, res) => {
  try {
    const height = await cosmosClient.getBlockHeight();
    if (!height) {
      return res.status(500).json({
        success: false,
        error: "无法获取区块高度",
      });
    }

    res.json({
      success: true,
      data: {
        height: height,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取交易
router.get("/transactions/:hash", async (req, res) => {
  try {
    const tx = await cosmosClient.getTransaction(
      req.params.hash
    );
    if (!tx) {
      return res.status(404).json({
        success: false,
        error: "交易未找到",
      });
    }

    res.json({
      success: true,
      data: {
        hash: tx.hash,
        height: tx.height,
        gasUsed: tx.result.gasUsed,
        gasWanted: tx.result.gasWanted,
        logs: tx.result.logs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取助记词（需要先创建钱包）
router.get("/mnemonic", async (req, res) => {
  try {
    const mnemonic = await cosmosClient.getMnemonic();
    res.json({
      success: true,
      data: {
        mnemonic: mnemonic,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 网络诊断接口
router.get("/diagnose", async (req, res) => {
  try {
    console.log("🔍 开始Cosmos网络诊断...");

    const diagnosis =
      await cosmosClient.diagnoseConnection();

    if (diagnosis.success) {
      // 如果诊断成功，重新初始化客户端
      await cosmosClient.initialize();
    }

    res.json({
      success: true,
      data: {
        diagnosis: diagnosis,
        connectionStatus:
          cosmosClient.getConnectionStatus(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取连接状态
router.get("/connection", (req, res) => {
  try {
    const status = cosmosClient.getConnectionStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
