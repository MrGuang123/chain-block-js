#!/bin/bash

echo "🚀 启动 Chain-Block 区块链系统..."

# 检查Node.js是否已安装
# 如果未安装则提示用户并退出
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "   访问 https://nodejs.org 下载并安装"
    exit 1
fi

# 检查npm是否已安装
# 如果未安装则提示用户并退出
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    echo "   npm通常随Node.js一起安装"
    exit 1
fi

# 显示Node.js和npm版本信息
echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

echo "📦 安装后端依赖..."
# 安装项目根目录的依赖包
npm install

echo "📦 安装前端依赖..."
# 进入client目录并安装前端依赖
cd client && npm install && cd ..

echo "🔧 创建数据目录..."
# 创建区块链数据存储目录
mkdir -p data

echo "🌐 启动后端服务器..."
# 在后台启动后端开发服务器
npm run dev &

echo "⏳ 等待后端服务器启动..."
# 等待5秒让后端服务器完全启动
sleep 5

echo "🎨 启动前端应用..."
# 在后台启动前端开发服务器
npm run client &

echo "✅ Chain-Block 系统启动完成！"
echo "📍 后端API: http://localhost:3001"
echo "🌐 前端界面: http://localhost:3000"
echo "📚 API文档: http://localhost:3001/api/health"

echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断信号
# 当用户按Ctrl+C时，会终止所有后台进程
wait
