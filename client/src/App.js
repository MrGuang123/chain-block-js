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

function App() {
  return (
    <Router>
      <Layout className="app-layout">
        <Navbar />
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blocks" element={<Blocks />} />
            <Route
              path="/transactions"
              element={<Transactions />}
            />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/mining" element={<Mining />} />
            <Route path="/cosmos" element={<Cosmos />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
