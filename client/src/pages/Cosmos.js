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
  Tag,
  Space,
  Divider,
} from "antd";
import {
  GlobalOutlined,
  WalletOutlined,
  SendOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const Cosmos = () => {
  const [cosmosStatus, setCosmosStatus] = useState(null);
  const [cosmosWallet, setCosmosWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCosmosStatus();
  }, []);

  const fetchCosmosStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/cosmos/status"
      );
      setCosmosStatus(response.data.data);
      setError(null);
    } catch (err) {
      setError("获取Cosmos网络状态失败");
      console.error("获取Cosmos状态失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const createCosmosWallet = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/cosmos/wallet"
      );
      const wallet = response.data.data;
      setCosmosWallet(wallet);
      message.success("Cosmos钱包创建成功！");

      // 保存助记词到本地存储（仅用于演示）
      localStorage.setItem(
        "cosmos_wallet",
        JSON.stringify(wallet)
      );
    } catch (err) {
      message.error("创建Cosmos钱包失败");
      console.error("创建Cosmos钱包失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const recoverCosmosWallet = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/cosmos/wallet/recover",
        {
          mnemonic: values.mnemonic,
        }
      );
      const wallet = response.data.data;
      setCosmosWallet(wallet);
      message.success("Cosmos钱包恢复成功！");
    } catch (err) {
      message.error("恢复Cosmos钱包失败");
      console.error("恢复Cosmos钱包失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendCosmosTokens = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/cosmos/send",
        {
          toAddress: values.toAddress,
          amount: values.amount,
          denom: values.denom || "uatom",
          mnemonic: values.mnemonic,
        }
      );

      message.success("Cosmos代币发送成功！");
      form.resetFields();
    } catch (err) {
      message.error(
        err.response?.data?.error || "发送Cosmos代币失败"
      );
      console.error("发送Cosmos代币失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 从本地存储加载Cosmos钱包
    const savedWallet =
      localStorage.getItem("cosmos_wallet");
    if (savedWallet) {
      try {
        const wallet = JSON.parse(savedWallet);
        setCosmosWallet(wallet);
      } catch (err) {
        console.error("解析Cosmos钱包数据失败:", err);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>
        <GlobalOutlined /> Cosmos网络
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Cosmos钱包" className="cosmos-card">
            {!cosmosWallet ? (
              <div>
                <Button
                  type="primary"
                  icon={<WalletOutlined />}
                  onClick={createCosmosWallet}
                  loading={loading}
                  block
                  style={{ marginBottom: 16 }}
                >
                  创建Cosmos钱包
                </Button>

                <Divider>或</Divider>

                <Form
                  onFinish={recoverCosmosWallet}
                  layout="vertical"
                >
                  <Form.Item
                    name="mnemonic"
                    label="助记词"
                    rules={[
                      {
                        required: true,
                        message: "请输入助记词",
                      },
                    ]}
                  >
                    <Input.TextArea
                      placeholder="输入12个或24个助记词，用空格分隔"
                      rows={3}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="default"
                      icon={<ReloadOutlined />}
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      恢复钱包
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <div>
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text strong>钱包地址: </Text>
                    <Text code copyable>
                      {cosmosWallet.address}
                    </Text>
                  </div>

                  <div>
                    <Text strong>助记词: </Text>
                    <Text
                      code
                      copyable
                      style={{ wordBreak: "break-all" }}
                    >
                      {cosmosWallet.mnemonic}
                    </Text>
                  </div>

                  <Alert
                    message="重要提示"
                    description="请妥善保管您的助记词，它是恢复钱包的唯一方式。"
                    type="warning"
                    showIcon
                  />
                </Space>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="发送Cosmos代币"
            className="cosmos-card"
          >
            <Form
              onFinish={sendCosmosTokens}
              layout="vertical"
            >
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
                <Input placeholder="Cosmos接收地址" />
              </Form.Item>

              <Form.Item
                name="amount"
                label="金额"
                rules={[
                  { required: true, message: "请输入金额" },
                ]}
              >
                <Input
                  type="number"
                  placeholder="代币数量"
                />
              </Form.Item>

              <Form.Item
                name="denom"
                label="代币类型"
                initialValue="uatom"
              >
                <Input placeholder="代币类型，如 uatom" />
              </Form.Item>

              <Form.Item
                name="mnemonic"
                label="助记词"
                rules={[
                  {
                    required: true,
                    message: "请输入助记词",
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="发送方钱包助记词"
                  rows={3}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  发送代币
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Cosmos网络状态">
            <Statistic
              title="网络状态"
              value={cosmosStatus ? "已连接" : "未连接"}
              valueStyle={{
                color: cosmosStatus ? "#3f8600" : "#cf1322",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="节点信息">
            {cosmosStatus?.nodeInfo && (
              <div>
                <Text strong>网络: </Text>
                <Tag color="blue">
                  {cosmosStatus.nodeInfo.network}
                </Tag>
                <br />
                <Text strong>版本: </Text>
                <Tag color="green">
                  {cosmosStatus.nodeInfo.version}
                </Tag>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="同步状态">
            {cosmosStatus?.syncInfo && (
              <div>
                <Text strong>最新区块: </Text>
                <Tag color="purple">
                  {cosmosStatus.syncInfo.latestBlockHeight}
                </Tag>
                <br />
                <Text strong>同步状态: </Text>
                <Tag
                  color={
                    cosmosStatus.syncInfo.catchingUp
                      ? "orange"
                      : "green"
                  }
                >
                  {cosmosStatus.syncInfo.catchingUp
                    ? "同步中"
                    : "已同步"}
                </Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cosmos;
