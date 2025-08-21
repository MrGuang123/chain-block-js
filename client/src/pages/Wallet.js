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
  Modal,
} from "antd";
import {
  WalletOutlined,
  PlusOutlined,
  SendOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

/**
 * 钱包管理页面组件
 * 提供钱包创建、交易发送、余额查询等功能
 */
const Wallet = () => {
  // 状态管理
  const [wallets, setWallets] = useState([]); // 钱包列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [error, setError] = useState(null); // 错误信息
  const [form] = Form.useForm(); // 表单实例

  /**
   * 创建新钱包
   * 调用API创建钱包并保存到本地存储
   * 注意：当前API只返回公钥信息，不包含私钥
   */
  const createWallet = async () => {
    try {
      setLoading(true);

      // 调用后端API创建钱包
      // 注意：当前API只返回公钥信息，不包含私钥
      const response = await axios.post(
        "/api/blockchain/wallet",
        { includePrivateKey: true } // 请求包含私钥（仅用于演示）
      );
      const newWallet = response.data.data;

      // 显示警告信息
      if (response.data.warning) {
        message.warning(response.data.warning);
      }

      // 更新钱包列表
      setWallets((prev) => [...prev, newWallet]);
      message.success("钱包创建成功！");

      // 保存钱包信息到本地存储
      // 注意：如果包含私钥，请确保安全存储
      localStorage.setItem(
        `wallet_${newWallet.address}`,
        JSON.stringify(newWallet)
      );

      // 显示私钥信息（仅用于演示）
      if (newWallet.privateKey) {
        message.info("请安全保存您的私钥！");
        console.log("私钥:", newWallet.privateKey);
      }
    } catch (err) {
      message.error("创建钱包失败");
      console.error("创建钱包失败:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 发送交易
   * 处理交易表单提交，发送已签名的交易
   * @param {Object} values - 表单数据
   */
  const sendTransaction = async (values) => {
    try {
      setLoading(true);

      // 调用后端API发送交易
      const response = await axios.post(
        "/api/blockchain/transactions",
        values
      );
      message.success("交易发送成功！");
      form.resetFields(); // 重置表单
    } catch (err) {
      message.error(
        err.response?.data?.error || "交易发送失败"
      );
      console.error("发送交易失败:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  /**
   * 获取钱包余额
   * @param {string} address - 钱包地址
   * @returns {number} 钱包余额
   */
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

  /**
   * 显示私钥信息
   * @param {string} address - 钱包地址
   */
  const showPrivateKey = (address) => {
    try {
      const walletData = localStorage.getItem(
        `wallet_${address}`
      );
      if (walletData) {
        const wallet = JSON.parse(walletData);
        if (wallet.privateKey) {
          Modal.confirm({
            title: "私钥信息",
            content: (
              <div>
                <p>
                  <strong>⚠️ 安全警告：</strong>
                </p>
                <p>
                  私钥是访问您钱包的唯一凭证，请妥善保管！
                </p>
                <p>
                  <strong>地址：</strong> {wallet.address}
                </p>
                <p>
                  <strong>私钥：</strong>
                </p>
                <Input.TextArea
                  value={wallet.privateKey}
                  readOnly
                  rows={3}
                  style={{ fontFamily: "monospace" }}
                />
              </div>
            ),
            okText: "复制私钥",
            cancelText: "关闭",
            onOk: () => {
              copyToClipboard(wallet.privateKey);
              message.success("私钥已复制到剪贴板");
            },
          });
        } else {
          message.warning("该钱包没有私钥信息");
        }
      }
    } catch (error) {
      message.error("获取私钥失败");
    }
  };

  /**
   * 组件挂载时从本地存储加载钱包
   */
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
      {/* 页面标题 */}
      <Title level={2}>
        <WalletOutlined /> 钱包管理
      </Title>

      <Row gutter={[16, 16]}>
        {/* 创建钱包卡片 */}
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

        {/* 发送交易卡片 */}
        <Col xs={24} lg={12}>
          <Card title="发送交易" className="wallet-card">
            <Form
              form={form}
              onFinish={sendTransaction}
              layout="vertical"
            >
              {/* 发送方地址输入 */}
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
                <Input placeholder="输入发送方钱包地址" />
              </Form.Item>

              {/* 接收方地址输入 */}
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
                <Input placeholder="输入接收方钱包地址" />
              </Form.Item>

              {/* 交易金额输入 */}
              <Form.Item
                name="amount"
                label="交易金额"
                rules={[
                  {
                    required: true,
                    message: "请输入交易金额",
                  },
                  {
                    type: "number",
                    min: 0.000001,
                    message: "金额必须大于0",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="输入交易金额"
                  step="0.000001"
                />
              </Form.Item>

              {/* 私钥输入（用于签名） */}
              <Form.Item
                name="privateKey"
                label="私钥"
                rules={[
                  {
                    required: true,
                    message: "请输入私钥",
                  },
                ]}
              >
                <Input.Password placeholder="输入发送方私钥" />
              </Form.Item>

              {/* 提交按钮 */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
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

      {/* 钱包列表 */}
      {wallets.length > 0 && (
        <Card title="我的钱包" style={{ marginTop: 16 }}>
          {wallets.map((wallet, index) => (
            <Card
              key={wallet.address}
              size="small"
              style={{ marginBottom: 8 }}
            >
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Text strong>钱包 {index + 1}</Text>
                  <br />
                  <Text code>{wallet.address}</Text>
                </Col>
                <Col span={4}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() =>
                      copyToClipboard(wallet.address)
                    }
                  >
                    复制地址
                  </Button>
                </Col>
                <Col span={4}>
                  <Button
                    size="small"
                    type="dashed"
                    onClick={() =>
                      showPrivateKey(wallet.address)
                    }
                  >
                    查看私钥
                  </Button>
                </Col>
                <Col span={4}>
                  <Statistic
                    title="余额"
                    value={wallet.balance || 0}
                    precision={6}
                    suffix="代币"
                  />
                </Col>
                <Col span={8}>
                  <Space>
                    <Tag color="blue">已创建</Tag>
                    <Text type="secondary">
                      {new Date(
                        wallet.createdAt
                      ).toLocaleString()}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default Wallet;
