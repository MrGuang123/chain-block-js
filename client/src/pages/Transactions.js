import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Spin,
  Alert,
  Tag,
  Space,
} from "antd";
import { TransactionOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/blockchain/transactions"
      );
      setTransactions(response.data.data);
      setError(null);
    } catch (err) {
      setError("获取交易数据失败");
      console.error("获取交易失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "transfer":
        return "blue";
      case "reward":
        return "green";
      case "mint":
        return "purple";
      default:
        return "default";
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case "transfer":
        return "转账";
      case "reward":
        return "挖矿奖励";
      case "mint":
        return "代币铸造";
      default:
        return type;
    }
  };

  const columns = [
    {
      title: "交易哈希",
      dataIndex: "hash",
      key: "hash",
      render: (hash) => (
        <Text
          className="hash-text"
          copyable={{ text: hash }}
        >
          {hash.substring(0, 16)}...
        </Text>
      ),
      width: 200,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={getTransactionTypeColor(type)}>
          {getTransactionTypeText(type)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "发送方",
      dataIndex: "fromAddress",
      key: "fromAddress",
      render: (address) =>
        address ? (
          <Text
            className="hash-text"
            copyable={{ text: address }}
          >
            {address.substring(0, 16)}...
          </Text>
        ) : (
          <Text type="secondary">系统</Text>
        ),
      width: 200,
    },
    {
      title: "接收方",
      dataIndex: "toAddress",
      key: "toAddress",
      render: (address) => (
        <Text
          className="hash-text"
          copyable={{ text: address }}
        >
          {address.substring(0, 16)}...
        </Text>
      ),
      width: 200,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Text strong style={{ color: "#52c41a" }}>
          {amount} 代币
        </Text>
      ),
      width: 120,
    },
    {
      title: "时间戳",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) => (
        <Text className="timestamp-text">
          {moment(timestamp).format("YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
      width: 180,
    },
    {
      title: "状态",
      key: "status",
      render: (_, record) => (
        <Tag color="green">已确认</Tag>
      ),
      width: 100,
    },
  ];

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
      <Title level={2}>
        <TransactionOutlined /> 交易记录
      </Title>

      <Card
        title={`交易列表 (共 ${transactions.length} 笔交易)`}
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="hash"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default Transactions;
