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
import {
  BlockOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;

const Blocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/blockchain/blocks"
      );
      setBlocks(response.data.data);
      setError(null);
    } catch (err) {
      setError("获取区块数据失败");
      console.error("获取区块失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "区块高度",
      dataIndex: "index",
      key: "index",
      render: (_, record, index) => blocks.length - index,
      width: 100,
    },
    {
      title: "哈希",
      dataIndex: "hash",
      key: "hash",
      render: (hash) => (
        <Space>
          <Text
            className="hash-text"
            copyable={{ text: hash }}
          >
            {hash.substring(0, 16)}...
          </Text>
        </Space>
      ),
      width: 200,
    },
    {
      title: "前一个哈希",
      dataIndex: "previousHash",
      key: "previousHash",
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
      title: "交易数量",
      dataIndex: "transactions",
      key: "transactions",
      render: (transactions) => (
        <Tag color="blue">{transactions.length}</Tag>
      ),
      width: 100,
    },
    {
      title: "Nonce",
      dataIndex: "nonce",
      key: "nonce",
      width: 80,
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      render: (difficulty) => (
        <Tag color="orange">{difficulty}</Tag>
      ),
      width: 80,
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
        <BlockOutlined /> 区块浏览器
      </Title>

      <Card title={`区块列表 (共 ${blocks.length} 个区块)`}>
        <Table
          columns={columns}
          dataSource={blocks}
          rowKey="hash"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default Blocks;
