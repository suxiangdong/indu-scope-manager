import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Button, Empty, Space, Typography } from 'antd';
import React from 'react';

const pageTitles: Record<string, string> = {
  '/operations/users': '用户管理',
  '/operations/verifications': '认证审核',
  '/operations/channels': '销售渠道审核',
  '/catalog/categories': '类目管理',
  '/catalog/attributes': '属性管理',
  '/catalog/products': '产品管理',
};

const ComingSoon: React.FC = () => {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || '功能页面';

  return (
    <PageContainer title={title} subTitle="平台管理功能">
      <ProCard variant="outlined">
        <Empty description={`${title}功能正在建设中`}>
          <Space>
            <Button onClick={() => history.push('/dashboard')}>
              返回工作台
            </Button>
            <Button
              type="primary"
              onClick={() => history.push('/system/admins')}
            >
              管理员账号
            </Button>
          </Space>
        </Empty>
        <Typography.Paragraph
          type="secondary"
          style={{ margin: '24px auto 0', maxWidth: 560, textAlign: 'center' }}
        >
          当前页面已纳入管理后台导航，接口接入后即可开始使用。
        </Typography.Paragraph>
      </ProCard>
    </PageContainer>
  );
};

export default ComingSoon;
