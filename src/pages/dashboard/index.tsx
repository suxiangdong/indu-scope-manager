import {
  ArrowRightOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  PlusOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Col,
  Divider,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React from 'react';

const metrics = [
  {
    title: '待审核认证',
    value: '—',
    suffix: '项',
    icon: <AuditOutlined />,
    color: '#e67700',
  },
  {
    title: '待审核销售渠道',
    value: '—',
    suffix: '项',
    icon: <ShopOutlined />,
    color: '#1971c2',
  },
  {
    title: '平台用户',
    value: '—',
    suffix: '人',
    icon: <TeamOutlined />,
    color: '#6741d9',
  },
  {
    title: '在售产品',
    value: '—',
    suffix: '个',
    icon: <DatabaseOutlined />,
    color: '#087f5b',
  },
];

const pendingItems = [
  {
    title: '个人实名认证',
    description: '等待审核的个人用户认证资料',
    count: '—',
    color: 'orange',
  },
  {
    title: '公司实名认证',
    description: '等待审核的公司资质与地址资料',
    count: '—',
    color: 'blue',
  },
  {
    title: '采购方销售渠道',
    description: '等待审核的网店或自建网站信息',
    count: '—',
    color: 'purple',
  },
];

const quickActions = [
  {
    label: '审核认证资料',
    path: '/operations/verifications',
    icon: <AuditOutlined />,
  },
  {
    label: '审核销售渠道',
    path: '/operations/channels',
    icon: <ShopOutlined />,
  },
  {
    label: '管理产品类目',
    path: '/catalog/categories',
    icon: <PlusOutlined />,
  },
  { label: '管理管理员账号', path: '/system/admins', icon: <UserOutlined /> },
];

const Dashboard: React.FC = () => {
  return (
    <PageContainer title="工作台" subTitle="平台运营概览">
      <ProCard
        variant="borderless"
        style={{
          overflow: 'hidden',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, #073b4c 0%, #0b7285 58%, #1098ad 100%)',
          color: '#fff',
        }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Typography.Text
              style={{ color: 'rgba(255,255,255,.72)', letterSpacing: 2 }}
            >
              INDU SCOPE / CONTROL CENTER
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{ margin: '12px 0 8px', color: '#fff' }}
            >
              欢迎进入工业视界管理后台
            </Typography.Title>
            <Typography.Paragraph
              style={{
                maxWidth: 620,
                marginBottom: 0,
                color: 'rgba(255,255,255,.78)',
              }}
            >
              从这里统一处理用户认证、销售渠道审核和产品资料维护，掌握平台运行状态。
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ padding: '6px 12px', borderRadius: 999 }}
            >
              系统运行正常
            </Tag>
          </Col>
        </Row>
      </ProCard>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {metrics.map((metric) => (
          <Col key={metric.title} xs={24} sm={12} xl={6}>
            <ProCard variant="outlined" style={{ height: '100%' }}>
              <Space align="start" size={14}>
                <span
                  style={{
                    display: 'grid',
                    width: 42,
                    height: 42,
                    placeItems: 'center',
                    borderRadius: 12,
                    background: `${metric.color}16`,
                    color: metric.color,
                    fontSize: 20,
                  }}
                >
                  {metric.icon}
                </span>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                />
              </Space>
            </ProCard>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={15}>
          <ProCard
            title="待处理事项"
            extra={
              <Button
                type="link"
                onClick={() => history.push('/operations/verifications')}
              >
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            variant="outlined"
          >
            <List
              dataSource={pendingItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key={item.title}
                      type="link"
                      onClick={() => history.push('/operations/verifications')}
                    >
                      去处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <ClockCircleOutlined
                        style={{ color: '#0b7285', fontSize: 18 }}
                      />
                    }
                    title={
                      <Space>
                        {item.title}
                        <Tag color={item.color}>{item.count} 待处理</Tag>
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </ProCard>
        </Col>
        <Col xs={24} xl={9}>
          <ProCard title="快捷入口" variant="outlined">
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {quickActions.map((action) => (
                <Button
                  key={action.path}
                  block
                  icon={action.icon}
                  style={{ height: 42, textAlign: 'left' }}
                  onClick={() => history.push(action.path)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </ProCard>
        </Col>
      </Row>

      <ProCard title="平台状态" variant="outlined" style={{ marginTop: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Typography.Text type="secondary">认证服务</Typography.Text>
            <Divider style={{ margin: '10px 0' }} />
            <Tag color="success">正常</Tag>
          </Col>
          <Col xs={24} sm={8}>
            <Typography.Text type="secondary">产品目录</Typography.Text>
            <Divider style={{ margin: '10px 0' }} />
            <Tag color="success">正常</Tag>
          </Col>
          <Col xs={24} sm={8}>
            <Typography.Text type="secondary">数据同步</Typography.Text>
            <Divider style={{ margin: '10px 0' }} />
            <Tag color="processing">等待业务接入</Tag>
          </Col>
        </Row>
      </ProCard>
    </PageContainer>
  );
};

export default Dashboard;
