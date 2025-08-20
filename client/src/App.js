import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Layout } from "antd";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Blocks from "./pages/Blocks";
import Transactions from "./pages/Transactions";
import Wallet from "./pages/Wallet";
import Mining from "./pages/Mining";
import Cosmos from "./pages/Cosmos";
import "./App.css";

const { Content } = Layout;

/**
 * 主应用组件
 * 配置路由和整体布局结构
 */
function App() {
  return (
    <Router>
      <Layout className="app-layout">
        {/* 导航栏组件 */}
        <Navbar />

        {/* 主要内容区域 */}
        <Content className="app-content">
          <Routes>
            {/* 仪表板页面 - 显示区块链概览信息 */}
            <Route path="/" element={<Dashboard />} />

            {/* 区块浏览页面 - 查看所有区块信息 */}
            <Route path="/blocks" element={<Blocks />} />

            {/* 交易记录页面 - 查看所有交易历史 */}
            <Route
              path="/transactions"
              element={<Transactions />}
            />

            {/* 钱包管理页面 - 创建钱包和发送交易 */}
            <Route path="/wallet" element={<Wallet />} />

            {/* 挖矿页面 - 执行挖矿操作 */}
            <Route path="/mining" element={<Mining />} />

            {/* Cosmos集成页面 - Cosmos网络操作 */}
            <Route path="/cosmos" element={<Cosmos />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
