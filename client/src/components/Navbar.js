import React from "react";
import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  BlockOutlined,
  TransactionOutlined,
  WalletOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

const { Header } = Layout;

const Navbar = () => {
  const location = useLocation();

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表板</Link>,
    },
    {
      key: "/blocks",
      icon: <BlockOutlined />,
      label: <Link to="/blocks">区块</Link>,
    },
    {
      key: "/transactions",
      icon: <TransactionOutlined />,
      label: <Link to="/transactions">交易</Link>,
    },
    {
      key: "/wallet",
      icon: <WalletOutlined />,
      label: <Link to="/wallet">钱包</Link>,
    },
    {
      key: "/mining",
      icon: <ThunderboltOutlined />,
      label: <Link to="/mining">挖矿</Link>,
    },
    {
      key: "/cosmos",
      icon: <GlobalOutlined />,
      label: <Link to="/cosmos">Cosmos</Link>,
    },
  ];

  return (
    <Header className="ant-layout-header">
      <div className="navbar">
        <div className="navbar-brand">🔗 Chain-Block</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="navbar-menu"
        />
      </div>
    </Header>
  );
};

export default Navbar;
