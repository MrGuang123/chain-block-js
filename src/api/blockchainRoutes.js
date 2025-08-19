const express = require("express");
const router = express.Router();
const Blockchain = require("../blockchain/Blockchain");
const Transaction = require("../blockchain/Transaction");
const Wallet = require("../blockchain/Wallet");
const CosmosClient = require("../cosmos/CosmosClient");

// 初始化区块链和Cosmos客户端
const blockchain = new Blockchain();
const cosmosClient = new CosmosClient();

// 初始化Cosmos客户端
cosmosClient.initialize().catch(console.error);

// 获取区块链状态
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

// 获取所有区块
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

// 获取特定区块
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

// 挖矿
router.post("/mine", async (req, res) => {
  try {
    const { minerAddress } = req.body;

    if (!minerAddress) {
      return res.status(400).json({
        success: false,
        error: "挖矿地址是必需的",
      });
    }

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

// 获取地址余额
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

// 创建新钱包
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

// 获取钱包信息
router.get("/wallet/:address", (req, res) => {
  try {
    const wallet = blockchain.getWallet(req.params.address);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "钱包未找到",
      });
    }

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

// 创建交易
router.post("/transactions", (req, res) => {
  try {
    const { fromAddress, toAddress, amount, privateKey } =
      req.body;

    if (
      !fromAddress ||
      !toAddress ||
      !amount ||
      !privateKey
    ) {
      return res.status(400).json({
        success: false,
        error: "所有字段都是必需的",
      });
    }

    // 创建交易
    const transaction = new Transaction(
      fromAddress,
      toAddress,
      amount
    );

    // 签名交易
    const EC = require("elliptic").ec;
    const ec = new EC("secp256k1");
    const key = ec.keyFromPrivate(privateKey, "hex");
    transaction.signTransaction(key);

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

// 获取所有交易
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

// 铸造代币
router.post("/mint", (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: "接收地址和数量是必需的",
      });
    }

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

// 验证区块链
router.get("/validate", (req, res) => {
  try {
    const isValid = blockchain.isChainValid();
    res.json({
      success: true,
      data: {
        isValid,
        chainLength: blockchain.chain.length,
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
