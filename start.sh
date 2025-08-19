#!/bin/bash

echo "🚀 启动 Chain-Block 区块链系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "📦 安装后端依赖..."
npm install

echo "📦 安装前端依赖..."
cd client && npm install && cd ..

echo "🔧 创建数据目录..."
mkdir -p data

echo "🌐 启动后端服务器..."
npm run dev &

echo "⏳ 等待后端服务器启动..."
sleep 5

echo "🎨 启动前端应用..."
npm run client &

echo "✅ Chain-Block 系统启动完成！"
echo "📍 后端API: http://localhost:3001"
echo "🌐 前端界面: http://localhost:3000"
echo "📚 API文档: http://localhost:3001/api/health"

echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
