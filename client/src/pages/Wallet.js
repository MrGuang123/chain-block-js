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
  Space,
  Divider,
  Row,
  Col,
  Statistic,
  Tag,
} from "antd";
import {
  WalletOutlined,
  PlusOutlined,
  SendOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const Wallet = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const createWallet = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/blockchain/wallet"
      );
      const newWallet = response.data.data;

      setWallets((prev) => [...prev, newWallet]);
      message.success("钱包创建成功！");

      // 保存私钥到本地存储（仅用于演示）
      localStorage.setItem(
        `wallet_${newWallet.address}`,
        JSON.stringify(newWallet)
      );
    } catch (err) {
      message.error("创建钱包失败");
      console.error("创建钱包失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/blockchain/transactions",
        values
      );
      message.success("交易发送成功！");
      form.resetFields();
    } catch (err) {
      message.error(
        err.response?.data?.error || "交易发送失败"
      );
      console.error("发送交易失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  const getWalletBalance = async (address) => {
    try {
      const response = await axios.get(
        `/api/blockchain/balance/${address}`
      );
      return response.data.data.balance;
    } catch (err) {
      console.error("获取余额失败:", err);
      return 0;
    }
  };

  useEffect(() => {
    // 从本地存储加载钱包
    const savedWallets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("wallet_")) {
        try {
          const wallet = JSON.parse(
            localStorage.getItem(key)
          );
          savedWallets.push(wallet);
        } catch (err) {
          console.error("解析钱包数据失败:", err);
        }
      }
    }
    setWallets(savedWallets);
  }, []);

  return (
    <div>
      <Title level={2}>
        <WalletOutlined /> 钱包管理
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="创建新钱包" className="wallet-card">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createWallet}
              loading={loading}
              block
            >
              创建钱包
            </Button>
            <Text
              type="secondary"
              style={{ display: "block", marginTop: 8 }}
            >
              创建新的区块链钱包，用于存储和管理代币
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="发送交易" className="wallet-card">
            <Form
              form={form}
              onFinish={sendTransaction}
              layout="vertical"
            >
              <Form.Item
                name="fromAddress"
                label="发送方地址"
                rules={[
                  {
                    required: true,
                    message: "请输入发送方地址",
                  },
                ]}
              >
                <Input placeholder="发送方钱包地址" />
              </Form.Item>

              <Form.Item
                name="toAddress"
                label="接收方地址"
                rules={[
                  {
                    required: true,
                    message: "请输入接收方地址",
                  },
                ]}
              >
                <Input placeholder="接收方钱包地址" />
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
                  placeholder="转账金额"
                />
              </Form.Item>

              <Form.Item
                name="privateKey"
                label="私钥"
                rules={[
                  { required: true, message: "请输入私钥" },
                ]}
              >
                <Input.Password placeholder="发送方私钥" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  发送交易
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="我的钱包" style={{ marginTop: 16 }}>
        {wallets.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px" }}
          >
            <Text type="secondary">
              暂无钱包，请先创建一个钱包
            </Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {wallets.map((wallet, index) => (
              <Col xs={24} lg={12} key={wallet.address}>
                <Card size="small" className="wallet-card">
                  <Row gutter={[8, 8]}>
                    <Col span={24}>
                      <Text strong>钱包 {index + 1}</Text>
                    </Col>
                    <Col span={24}>
                      <Space>
                        <Text className="hash-text">
                          {wallet.address.substring(0, 20)}
                          ...
                        </Text>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() =>
                            copyToClipboard(wallet.address)
                          }
                        >
                          复制
                        </Button>
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Statistic
                        title="余额"
                        value={wallet.balance || 0}
                        suffix="代币"
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Col>
                    <Col span={24}>
                      <Tag color="blue">
                        创建时间:{" "}
                        {new Date(
                          wallet.createdAt
                        ).toLocaleString()}
                      </Tag>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default Wallet;
