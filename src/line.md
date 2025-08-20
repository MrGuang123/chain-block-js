系统启动流程

1. 创建 Express 应用
2. 初始化区块链实例: new Blockchain()
3. 从 LevelDB 加载数据: blockchain.loadFromDatabase()
4. 启动 HTTP 服务器
5. 初始化 Cosmos 客户端

钱包创建流程
// 前端调用
POST /api/blockchain/wallet

// 后端处理

1. blockchain.createWallet()
   → 生成椭圆曲线密钥对
   → 公钥作为地址
   → 保存到 wallets Map

2. 返回钱包信息（不包含私钥）
3. 前端保存私钥到 localStorage

交易创建和签名流程
// 前端提交交易
POST /api/blockchain/transactions
{
fromAddress: "发送方地址",
toAddress: "接收方地址",
amount: 100,
privateKey: "发送方私钥"
}

// 后端处理

1. 创建交易对象: new Transaction()
2. 使用私钥签名: transaction.signTransaction(key)
3. 验证交易: transaction.isValid()
4. 添加到待处理队列: blockchain.addTransaction()
5. 检查余额是否充足

挖矿流程
// 前端触发挖矿
POST /api/blockchain/mine
{
minerAddress: "矿工地址"
}

// 后端挖矿流程

1. 创建挖矿奖励交易
2. 创建新区块（包含所有待处理交易）
3. 执行工作量证明算法
   - 不断改变 nonce 值
   - 计算区块哈希
   - 检查是否满足难度要求（前 4 位为 0）
4. 找到有效哈希后，将区块添加到链上
5. 清空待处理交易队列
6. 更新所有钱包余额
7. 保存到数据库

数据持久化
// 保存到 LevelDB
async saveToDatabase() {
await this.db.put("chain", JSON.stringify(this.chain));
await this.db.put("wallets", JSON.stringify(Array.from(this.wallets)));
await this.db.put("pendingTransactions", JSON.stringify(this.pendingTransactions));
}

// 从 LevelDB 加载
async loadFromDatabase() {
const chainData = await this.db.get("chain");
this.chain = JSON.parse(chainData).map(blockData => Block.fromJSON(blockData));
// 类似地加载钱包和待处理交易
}

// 核心加密库
"crypto-js": "^4.1.1" // SHA256 哈希算法
"elliptic": "^6.5.4" // 椭圆曲线加密 (secp256k1)

// 数据存储
"level": "^8.0.0" // LevelDB 键值数据库

// Cosmos 集成
"@cosmjs/stargate": "^0.31.1" // Cosmos SDK
"@cosmjs/proto-signing": "^0.31.1" // 交易签名

安装依赖 → npm install && npm run install-client
启动后端 → npm run dev (端口 3001)
启动前端 → npm run client (端口 3000)
创建钱包 → 通过 Web 界面创建
铸造代币 → 为钱包添加初始代币
执行挖矿 → 验证交易并创建新区块
进行转账 → 用户间代币转移
