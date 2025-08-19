# Chain-Block API 文档

## 概述

Chain-Block 是一个完整的区块链系统，提供以下功能：

- 区块链核心功能（区块、交易、挖矿）
- 钱包管理
- 代币经济系统
- Cosmos SDK 集成

## 基础信息

- **基础 URL**: `http://localhost:3001`
- **API 版本**: v1
- **数据格式**: JSON

## 区块链 API

### 获取区块链状态

```
GET /api/blockchain/status
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "chainLength": 5,
    "pendingTransactions": 2,
    "totalWallets": 3,
    "difficulty": 4,
    "miningReward": 100,
    "isValid": true
  }
}
```

### 获取所有区块

```
GET /api/blockchain/blocks
```

### 获取特定区块

```
GET /api/blockchain/blocks/:hash
```

### 挖矿

```
POST /api/blockchain/mine
```

**请求体**:

```json
{
  "minerAddress": "04a1b2c3d4e5f6..."
}
```

### 获取地址余额

```
GET /api/blockchain/balance/:address
```

### 创建钱包

```
POST /api/blockchain/wallet
```

### 获取钱包信息

```
GET /api/blockchain/wallet/:address
```

### 创建交易

```
POST /api/blockchain/transactions
```

**请求体**:

```json
{
  "fromAddress": "04a1b2c3d4e5f6...",
  "toAddress": "04f6e5d4c3b2a1...",
  "amount": 50,
  "privateKey": "1234567890abcdef..."
}
```

### 获取所有交易

```
GET /api/blockchain/transactions
```

### 铸造代币

```
POST /api/blockchain/mint
```

**请求体**:

```json
{
  "toAddress": "04a1b2c3d4e5f6...",
  "amount": 1000
}
```

### 验证区块链

```
GET /api/blockchain/validate
```

## Cosmos API

### 获取 Cosmos 网络状态

```
GET /api/cosmos/status
```

### 创建 Cosmos 钱包

```
POST /api/cosmos/wallet
```

### 从助记词恢复钱包

```
POST /api/cosmos/wallet/recover
```

**请求体**:

```json
{
  "mnemonic": "word1 word2 word3 ..."
}
```

### 获取账户信息

```
GET /api/cosmos/account/:address
```

### 获取余额

```
GET /api/cosmos/balance/:address?denom=uatom
```

### 发送代币

```
POST /api/cosmos/send
```

**请求体**:

```json
{
  "toAddress": "cosmos1...",
  "amount": "1000000",
  "denom": "uatom",
  "mnemonic": "word1 word2 word3 ..."
}
```

### 获取最新区块

```
GET /api/cosmos/blocks/latest
```

### 获取区块高度

```
GET /api/cosmos/blocks/height
```

### 获取交易

```
GET /api/cosmos/transactions/:hash
```

## 错误处理

所有 API 都返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述"
}
```

常见 HTTP 状态码：

- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源未找到
- `500`: 服务器内部错误

## 使用示例

### 创建钱包并发送交易

```javascript
// 1. 创建钱包
const walletResponse = await fetch(
  "/api/blockchain/wallet",
  {
    method: "POST",
  }
);
const wallet = await walletResponse.json();

// 2. 铸造一些代币
await fetch("/api/blockchain/mint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    toAddress: wallet.data.address,
    amount: 1000,
  }),
});

// 3. 挖矿确认交易
await fetch("/api/blockchain/mine", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    minerAddress: wallet.data.address,
  }),
});

// 4. 发送交易
await fetch("/api/blockchain/transactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fromAddress: wallet.data.address,
    toAddress: "04f6e5d4c3b2a1...",
    amount: 50,
    privateKey: wallet.data.privateKey,
  }),
});
```
