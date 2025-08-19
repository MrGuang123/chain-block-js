import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Spin,
  Alert,
  Form,
  Input,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Space,
} from "antd";
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const Mining = () => {
  const [mining, setMining] = useState(false);
  const [minerAddress, setMinerAddress] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        "/api/blockchain/status"
      );
      setStats(response.data.data);
    } catch (err) {
      console.error("获取状态失败:", err);
    }
  };

  const startMining = async (values) => {
    try {
      setLoading(true);
      setMining(true);

      const response = await axios.post(
        "/api/blockchain/mine",
        {
          minerAddress: values.minerAddress,
        }
      );

      message.success(
        "挖矿成功！获得奖励: " +
          response.data.data.reward +
          " 代币"
      );
      setMinerAddress(values.minerAddress);

      // 刷新统计数据
      await fetchStats();
    } catch (err) {
      message.error(
        err.response?.data?.error || "挖矿失败"
      );
      console.error("挖矿失败:", err);
    } finally {
      setLoading(false);
      setMining(false);
    }
  };

  const stopMining = () => {
    setMining(false);
    message.info("挖矿已停止");
  };

  const mintTokens = async (values) => {
    try {
      setLoading(true);
      await axios.post("/api/blockchain/mint", {
        toAddress: values.toAddress,
        amount: values.amount,
      });

      message.success("代币铸造成功！");
      form.resetFields();

      // 刷新统计数据
      await fetchStats();
    } catch (err) {
      message.error(
        err.response?.data?.error || "代币铸造失败"
      );
      console.error("代币铸造失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>
        <ThunderboltOutlined /> 挖矿中心
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="开始挖矿" className="mining-card">
            <Form onFinish={startMining} layout="vertical">
              <Form.Item
                name="minerAddress"
                label="矿工地址"
                rules={[
                  {
                    required: true,
                    message: "请输入矿工地址",
                  },
                ]}
              >
                <Input placeholder="接收挖矿奖励的钱包地址" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  htmlType="submit"
                  loading={loading}
                  disabled={mining}
                  block
                >
                  开始挖矿
                </Button>
              </Form.Item>
            </Form>

            {mining && (
              <div style={{ marginTop: 16 }}>
                <Progress percent={100} status="active" />
                <Text type="secondary">正在挖矿中...</Text>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={stopMining}
                  style={{ marginLeft: 16 }}
                >
                  停止挖矿
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="代币铸造" className="mining-card">
            <Form onFinish={mintTokens} layout="vertical">
              <Form.Item
                name="toAddress"
                label="接收地址"
                rules={[
                  {
                    required: true,
                    message: "请输入接收地址",
                  },
                ]}
              >
                <Input placeholder="接收铸造代币的地址" />
              </Form.Item>

              <Form.Item
                name="amount"
                label="铸造数量"
                rules={[
                  {
                    required: true,
                    message: "请输入铸造数量",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="代币数量"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  铸造代币
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="挖矿统计">
            <Statistic
              title="区块高度"
              value={stats?.chainLength || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="挖矿奖励">
            <Statistic
              title="每次挖矿奖励"
              value={stats?.miningReward || 0}
              suffix="代币"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="挖矿难度">
            <Statistic
              title="当前难度"
              value={stats?.difficulty || 0}
              suffix="个零"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="挖矿信息" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space
              direction="vertical"
              size="large"
              style={{ width: "100%" }}
            >
              <div>
                <Text strong>挖矿状态: </Text>
                <Tag color={mining ? "green" : "red"}>
                  {mining ? "挖矿中" : "未挖矿"}
                </Tag>
              </div>

              {minerAddress && (
                <div>
                  <Text strong>矿工地址: </Text>
                  <Text code>{minerAddress}</Text>
                </div>
              )}

              <div>
                <Text strong>待处理交易: </Text>
                <Tag color="orange">
                  {stats?.pendingTransactions || 0}
                </Tag>
              </div>

              <div>
                <Text strong>区块链状态: </Text>
                <Tag
                  color={stats?.isValid ? "green" : "red"}
                >
                  {stats?.isValid ? "有效" : "无效"}
                </Tag>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Mining;
