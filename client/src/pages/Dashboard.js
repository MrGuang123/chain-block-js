import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  BlockOutlined,
  TransactionOutlined,
  WalletOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/blockchain/status"
      );
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError("获取区块链状态失败");
      console.error("获取状态失败:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>区块链仪表板</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="区块高度"
              value={stats?.chainLength || 0}
              prefix={<BlockOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理交易"
              value={stats?.pendingTransactions || 0}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="钱包数量"
              value={stats?.totalWallets || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="挖矿奖励"
              value={stats?.miningReward || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix="代币"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        <Col xs={24} lg={12}>
          <Card title="区块链信息" className="stats-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="挖矿难度"
                  value={stats?.difficulty || 0}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="链状态"
                  value={stats?.isValid ? "有效" : "无效"}
                  valueStyle={{
                    color: stats?.isValid
                      ? "#3f8600"
                      : "#cf1322",
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="系统状态" className="stats-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="服务器状态"
                  value="运行中"
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="数据库状态"
                  value="已连接"
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
