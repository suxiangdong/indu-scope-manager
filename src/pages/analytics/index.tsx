import {
  BarChartOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Empty,
  message,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import {
  type AnalyticsDailyStat,
  type AnalyticsOverview,
  getAnalyticsOverview,
} from '@/services/analytics';

const dailyColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '产品点击', dataIndex: 'product_clicks', key: 'product_clicks' },
  {
    title: '需求点击',
    dataIndex: 'requirement_clicks',
    key: 'requirement_clicks',
  },
  { title: '合计', dataIndex: 'total_clicks', key: 'total_clicks' },
];

const topColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '点击次数', dataIndex: 'clicks', key: 'clicks', width: 120 },
];

const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await getAnalyticsOverview(30));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '获取数据统计失败',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContainer
      title="数据统计"
      subTitle="查看产品与采购需求的详情页点击情况"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void load()}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      <ProCard loading={loading} variant="borderless">
        {overview ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Statistic
                    title="总点击次数"
                    value={overview.total_clicks}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Statistic
                    title="产品详情点击"
                    value={overview.product_clicks}
                    prefix={<DatabaseOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Statistic
                    title="需求详情点击"
                    value={overview.requirement_clicks}
                    prefix={<FileSearchOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Statistic
                    title="统计周期"
                    value={overview.days}
                    suffix="天"
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} xl={12}>
                <Card title="热门产品" size="small">
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={topColumns}
                    dataSource={overview.top_products}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="暂无产品点击数据"
                        />
                      ),
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card title="热门采购需求" size="small">
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={topColumns}
                    dataSource={overview.top_requirements}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="暂无需求点击数据"
                        />
                      ),
                    }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="每日点击趋势" size="small" style={{ marginTop: 16 }}>
              <Table<AnalyticsDailyStat>
                rowKey="date"
                size="small"
                pagination={false}
                columns={dailyColumns}
                dataSource={overview.daily}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无趋势数据"
                    />
                  ),
                }}
              />
            </Card>

            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 16, marginBottom: 0 }}
            >
              统计范围：最近 {overview.days}{' '}
              天；点击在用户打开产品或采购需求详情页并成功加载内容后记录。
            </Typography.Paragraph>
          </>
        ) : (
          <Space
            direction="vertical"
            align="center"
            style={{ width: '100%', padding: 48 }}
          >
            <Empty description="暂无统计数据" />
          </Space>
        )}
      </ProCard>
    </PageContainer>
  );
};

export default AnalyticsPage;
