import { SaveOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Card, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import {
  listVipAgreements,
  updateVipAgreement,
  type VipAgreement,
  type VipAgreementForm,
} from '@/services/vipAgreements';

const AGREEMENT_META: Record<
  VipAgreement['key'],
  { label: string; description: string }
> = {
  service: {
    label: '会员服务协议',
    description: '说明会员权益、服务范围和使用规则。',
  },
  'auto-renew': {
    label: '自动续费协议',
    description: '说明自动续费扣款、取消方式和到期处理规则。',
  },
};

const defaults: Record<VipAgreement['key'], VipAgreement> = {
  service: {
    id: 0,
    key: 'service',
    title: '会员服务协议',
    content: '',
    status: 1,
    version: 1,
    updated_at: '',
  },
  'auto-renew': {
    id: 0,
    key: 'auto-renew',
    title: '自动续费协议',
    content: '',
    status: 1,
    version: 1,
    updated_at: '',
  },
};

const VipAgreements: React.FC = () => {
  const { message } = App.useApp();
  const [agreements, setAgreements] =
    useState<Record<VipAgreement['key'], VipAgreement>>(defaults);
  const [activeKey, setActiveKey] = useState<VipAgreement['key']>('service');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    listVipAgreements()
      .then((result) => {
        if (!mounted) return;
        setAgreements((current) => {
          const next = { ...current };
          (result.items || []).forEach((item) => {
            if (item.key === 'service' || item.key === 'auto-renew')
              next[item.key] = { ...next[item.key], ...item };
          });
          return next;
        });
      })
      .catch((error) =>
        message.error(
          error instanceof Error ? error.message : '获取会员协议失败',
        ),
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [message]);

  const handleSubmit = async (
    key: VipAgreement['key'],
    values: VipAgreementForm,
  ) => {
    setSaving(true);
    try {
      const result = await updateVipAgreement(key, {
        ...values,
        status: Number(values.status ?? 1),
      });
      setAgreements((items) => ({ ...items, [key]: result }));
      message.success(`${AGREEMENT_META[key].label}已保存，版本已更新`);
      return true;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '保存会员协议失败',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="会员协议"
      subTitle="管理小程序展示的会员服务协议和自动续费协议"
    >
      <Card loading={loading}>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as VipAgreement['key'])}
          items={(Object.keys(AGREEMENT_META) as VipAgreement['key'][]).map(
            (key) => ({
              key,
              label: AGREEMENT_META[key].label,
              children: (
                <>
                  <Typography.Paragraph type="secondary">
                    {AGREEMENT_META[key].description} 当前版本：v
                    {agreements[key].version}。
                  </Typography.Paragraph>
                  <ProForm<VipAgreementForm>
                    name={`vip-agreement-${key}`}
                    key={`${key}-${agreements[key].version}`}
                    initialValues={{
                      title: agreements[key].title,
                      content: agreements[key].content,
                      status: agreements[key].status,
                    }}
                    onFinish={(values) => handleSubmit(key, values)}
                    submitter={{
                      searchConfig: { submitText: '保存协议' },
                      submitButtonProps: {
                        loading: saving,
                        icon: <SaveOutlined />,
                      },
                    }}
                  >
                    <ProFormText
                      name="title"
                      label="协议标题"
                      rules={[{ required: true, message: '请输入协议标题' }]}
                    />
                    <ProFormSelect
                      name="status"
                      label="发布状态"
                      options={[
                        { label: '启用', value: 1 },
                        { label: '停用', value: 0 },
                      ]}
                      rules={[{ required: true }]}
                    />
                    <ProFormTextArea
                      name="content"
                      label="协议正文"
                      tooltip="支持换行，小程序端会在用户点击协议名称时展示完整内容。"
                      rules={[{ required: true, message: '请输入协议正文' }]}
                      fieldProps={{
                        rows: 18,
                        maxLength: 50000,
                        showCount: true,
                      }}
                    />
                  </ProForm>
                </>
              ),
            }),
          )}
        />
      </Card>
    </PageContainer>
  );
};

export default VipAgreements;
