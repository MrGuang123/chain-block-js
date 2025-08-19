const Blockchain = require("./src/blockchain/Blockchain");
const Wallet = require("./src/blockchain/Wallet");
const Transaction = require("./src/blockchain/Transaction");

async function testBlockchain() {
  console.log("🧪 开始测试区块链系统...\n");

  // 创建区块链实例
  const blockchain = new Blockchain();
  console.log("✅ 区块链实例创建成功");

  // 创建钱包
  const wallet1 = blockchain.createWallet();
  const wallet2 = blockchain.createWallet();
  console.log("✅ 钱包创建成功");
  console.log(`钱包1地址: ${wallet1.getAddress()}`);
  console.log(`钱包2地址: ${wallet2.getAddress()}`);

  // 铸造代币
  blockchain.mintTokens(wallet1.getAddress(), 1000);
  console.log("✅ 代币铸造成功");

  // 挖矿确认交易
  console.log("\n⛏️ 开始挖矿...");
  const block = await blockchain.minePendingTransactions(
    wallet1.getAddress()
  );
  console.log("✅ 挖矿成功，新区块哈希:", block.hash);

  // 创建转账交易
  const transaction = new Transaction(
    wallet1.getAddress(),
    wallet2.getAddress(),
    100
  );

  // 签名交易
  const EC = require("elliptic").ec;
  const ec = new EC("secp256k1");
  const key = ec.keyFromPrivate(
    wallet1.getPrivateKey(),
    "hex"
  );
  transaction.signTransaction(key);

  // 添加交易到区块链
  blockchain.addTransaction(transaction);
  console.log("✅ 交易创建成功");

  // 再次挖矿确认交易
  console.log("\n⛏️ 再次挖矿确认交易...");
  const block2 = await blockchain.minePendingTransactions(
    wallet2.getAddress()
  );
  console.log("✅ 挖矿成功，新区块哈希:", block2.hash);

  // 检查余额
  const balance1 = blockchain.getBalanceOfAddress(
    wallet1.getAddress()
  );
  const balance2 = blockchain.getBalanceOfAddress(
    wallet2.getAddress()
  );
  console.log("\n💰 余额检查:");
  console.log(`钱包1余额: ${balance1} 代币`);
  console.log(`钱包2余额: ${balance2} 代币`);

  // 验证区块链
  const isValid = blockchain.isChainValid();
  console.log(
    `\n🔍 区块链验证: ${isValid ? "✅ 有效" : "❌ 无效"}`
  );

  // 获取统计信息
  const stats = blockchain.getStats();
  console.log("\n📊 区块链统计:");
  console.log(`区块数量: ${stats.chainLength}`);
  console.log(`待处理交易: ${stats.pendingTransactions}`);
  console.log(`钱包数量: ${stats.totalWallets}`);
  console.log(`挖矿难度: ${stats.difficulty}`);
  console.log(`挖矿奖励: ${stats.miningReward} 代币`);

  console.log("\n🎉 测试完成！");
}

// 运行测试
testBlockchain().catch(console.error);
