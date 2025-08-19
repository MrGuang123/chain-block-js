# Chain-Block: JavaScript 区块链实现

一个使用 JavaScript 实现的完整区块链系统，集成了 Cosmos SDK。

## 功能特性

- ✅ 代币生产和管理
- ✅ 用户钱包创建和管理
- ✅ 代币转账功能
- ✅ 工作量证明挖矿机制
- ✅ 区块链浏览器 Web 界面
- ✅ Cosmos SDK 集成

## 技术栈

- **后端**: Node.js, Express, LevelDB
- **前端**: React, Web3.js
- **区块链**: 自定义 JavaScript 实现
- **加密**: crypto-js, elliptic
- **Cosmos**: @cosmjs/stargate

## 快速开始

### 安装依赖

```bash
npm install
npm run install-client
```

### 启动开发服务器

```bash
# 启动后端服务器
npm run dev

# 启动前端客户端（新终端）
npm run client
```

### 生产环境

```bash
npm start
```

## 项目结构

```
chain-block/
├── src/
│   ├── blockchain/          # 区块链核心实现
│   ├── cosmos/             # Cosmos SDK集成
│   ├── api/                # REST API接口
│   └── server.js           # 服务器入口
├── client/                 # React前端应用
├── data/                   # 区块链数据存储
└── docs/                   # 文档
```

## API 接口

### 区块链操作

- `GET /api/blocks` - 获取所有区块
- `GET /api/blocks/:hash` - 获取特定区块
- `POST /api/mine` - 挖矿
- `GET /api/balance/:address` - 查询余额

### 交易操作

- `POST /api/transactions` - 创建交易
- `GET /api/transactions` - 获取所有交易
- `POST /api/transactions/broadcast` - 广播交易

### 钱包操作

- `POST /api/wallet` - 创建新钱包
- `GET /api/wallet/:address` - 获取钱包信息

## 许可证

MIT
