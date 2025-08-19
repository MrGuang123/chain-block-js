const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// 导入路由
const blockchainRoutes = require("./api/blockchainRoutes");
const cosmosRoutes = require("./api/cosmosRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(
  express.static(path.join(__dirname, "../client/build"))
);

// API路由
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/cosmos", cosmosRoutes);

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "区块链服务器运行正常",
    timestamp: new Date().toISOString(),
  });
});

// 根路径
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../client/build/index.html")
  );
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
  });
});

// 404处理
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "接口未找到",
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 区块链服务器已启动`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(
    `🔗 API文档: http://localhost:${PORT}/api/health`
  );
  console.log(`🌐 区块链浏览器: http://localhost:${PORT}`);
  console.log(
    `⏰ 启动时间: ${new Date().toLocaleString()}`
  );
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n🛑 正在关闭服务器...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 正在关闭服务器...");
  process.exit(0);
});

module.exports = app;
