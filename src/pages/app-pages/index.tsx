import { SaveOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Card, Col, Row, Space, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import {
  type AppPageContent,
  type AppPageFormValues,
  type AppPageKey,
  listAppPages,
  updateAppPage,
} from '@/services/appPages';

const PAGE_META: Record<AppPageKey, { label: string; description: string }> = {
  'about-us': {
    label: '关于我们',
    description: '介绍平台定位、服务范围和业务价值。',
  },
  contact: {
    label: '联系我们',
    description: '维护客服电话、邮箱、服务时间和联系地址。',
  },
};

const defaultPage: AppPageContent = {
  page_key: 'about-us',
  title: '',
  summary: '',
  body: '',
  contact_phone: '',
  contact_email: '',
  service_hours: '',
  address: '',
  wechat_account: '',
  status: 1,
};

const AppPages: React.FC = () => {
  const { message } = App.useApp();
  const [pages, setPages] = useState<Record<AppPageKey, AppPageContent>>({
    'about-us': { ...defaultPage, page_key: 'about-us' },
    contact: { ...defaultPage, page_key: 'contact' },
  });
  const [activeKey, setActiveKey] = useState<AppPageKey>('about-us');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    listAppPages()
      .then((items) => {
        if (!mounted) return;
        setPages((current) => {
          const next = { ...current };
          items.forEach((item) => {
            if (item.page_key === 'about-us' || item.page_key === 'contact') {
              next[item.page_key] = { ...next[item.page_key], ...item };
            }
          });
          return next;
        });
      })
      .catch((error) =>
        message.error(
          error instanceof Error ? error.message : '获取小程序页面内容失败',
        ),
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [message]);

  const handleSubmit = async (key: AppPageKey, values: AppPageFormValues) => {
    setSaving(true);
    try {
      const result = await updateAppPage(key, {
        ...values,
        status: Number(values.status ?? 1),
      });
      setPages((current) => ({ ...current, [key]: result }));
      message.success(`${PAGE_META[key].label}内容已保存`);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="小程序页面"
      subTitle="统一维护关于我们和联系我们页面内容"
    >
      <Card loading={loading}>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as AppPageKey)}
          items={(Object.keys(PAGE_META) as AppPageKey[]).map((key) => ({
            key,
            label: PAGE_META[key].label,
            children: (
              <>
                <Typography.Paragraph type="secondary">
                  {PAGE_META[key].description}
                </Typography.Paragraph>
                <ProForm<AppPageFormValues>
                  name={`app-page-${key}`}
                  key={`${key}-${pages[key].updated_at || 'new'}`}
                  initialValues={pages[key]}
                  onFinish={(values) => handleSubmit(key, values)}
                  submitter={{
                    render: (_, dom) => <Space>{dom}</Space>,
                    submitButtonProps: {
                      loading: saving,
                      icon: <SaveOutlined />,
                    },
                  }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <ProFormText
                        name="title"
                        label="页面标题"
                        rules={[{ required: true, message: '请输入页面标题' }]}
                      />
                    </Col>
                    <Col span={12}>
                      <ProFormSelect
                        name="status"
                        label="发布状态"
                        options={[
                          { label: '启用', value: 1 },
                          { label: '停用', value: 0 },
                        ]}
                        rules={[{ required: true }]}
                      />
                    </Col>
                  </Row>
                  <ProFormTextArea
                    name="summary"
                    label="摘要"
                    fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
                  />
                  <ProFormTextArea
                    name="body"
                    label="正文内容"
                    tooltip="支持普通文本和换行，小程序端会按段落展示。"
                    rules={[{ required: true, message: '请输入正文内容' }]}
                    fieldProps={{ rows: 10, maxLength: 10000, showCount: true }}
                  />
                  {key === 'contact' && (
                    <Row gutter={24}>
                      <Col span={12}>
                        <ProFormText name="contact_phone" label="客服电话" />
                      </Col>
                      <Col span={12}>
                        <ProFormText name="contact_email" label="客服邮箱" />
                      </Col>
                      <Col span={12}>
                        <ProFormText name="service_hours" label="服务时间" />
                      </Col>
                      <Col span={12}>
                        <ProFormText name="wechat_account" label="微信号" />
                      </Col>
                      <Col span={24}>
                        <ProFormText name="address" label="联系地址" />
                      </Col>
                    </Row>
                  )}
                </ProForm>
              </>
            ),
          }))}
        />
      </Card>
    </PageContainer>
  );
};

export default AppPages;
