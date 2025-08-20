const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// 导入API路由模块
const blockchainRoutes = require("./api/blockchainRoutes");
const cosmosRoutes = require("./api/cosmosRoutes");

// 创建Express应用实例
const app = express();
const PORT = process.env.PORT || 3001; // 服务器端口，支持环境变量配置

// 中间件配置
app.use(cors()); // 启用跨域资源共享
app.use(bodyParser.json()); // 解析JSON请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务 - 提供前端构建文件
app.use(
  express.static(path.join(__dirname, "../client/build"))
);

// API路由配置
app.use("/api/blockchain", blockchainRoutes); // 区块链相关API
app.use("/api/cosmos", cosmosRoutes); // Cosmos相关API

/**
 * 健康检查接口
 * 用于监控服务器运行状态
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "区块链服务器运行正常",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 根路径处理
 * 返回前端应用的入口HTML文件
 */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../client/build/index.html")
  );
});

/**
 * 全局错误处理中间件
 * 捕获并处理所有未处理的错误
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
  });
});

/**
 * 404错误处理
 * 处理所有未找到的路由
 */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "接口未找到",
  });
});

/**
 * 启动HTTP服务器
 * 监听指定端口并输出启动信息
 */
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

/**
 * 优雅关闭处理
 * 在接收到中断信号时安全关闭服务器
 */
process.on("SIGINT", () => {
  console.log("\n🛑 正在关闭服务器...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 正在关闭服务器...");
  process.exit(0);
});

// 导出应用实例，用于测试
module.exports = app;
