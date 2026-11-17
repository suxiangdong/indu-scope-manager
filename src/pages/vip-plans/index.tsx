import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';

import {
  createVipPlan,
  listVipPlans,
  updateVipPlan,
  updateVipPlanStatus,
  type VipPlan,
  type VipPlanForm,
} from '@/services/vipPlans';

const VipPlans: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VipPlan>();
  const handleSubmit = async (values: VipPlanForm) => {
    try {
      const { code: _code, ...editableValues } = values;
      const data = {
        ...editableValues,
        duration_days: Number(values.duration_days),
        price_fen: Number(values.price_fen),
        original_price_fen: Number(values.original_price_fen || 0),
        sort_order: Number(values.sort_order || 0),
        plan_type: values.plan_type,
        auto_renew_enabled: values.plan_type === 'auto_renew' ? 1 : 0,
      };
      if (editing) {
        await updateVipPlan(editing.id, data);
        message.success('会员套餐已更新');
      } else {
        await createVipPlan(data);
        message.success('会员套餐已创建');
      }
      setOpen(false);
      setEditing(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '保存会员套餐失败',
      );
      return false;
    }
  };
  const columns: ProColumns<VipPlan>[] = [
    { title: '套餐名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code', copyable: true },
    {
      title: '套餐类型',
      dataIndex: 'plan_type',
      render: (_, record) =>
        record.plan_type === 'auto_renew' ? (
          <Tag color="processing">自动续费</Tag>
        ) : (
          <Tag>普通套餐</Tag>
        ),
    },
    {
      title: '周期',
      dataIndex: 'billing_cycle',
      render: (_, record) =>
        record.billing_cycle === 'month'
          ? '月度'
          : record.billing_cycle === 'quarter'
            ? '季度'
            : record.billing_cycle === 'year'
              ? '年度'
              : '自定义',
    },
    {
      title: '价格',
      dataIndex: 'price_fen',
      render: (_, record) =>
        record.price_fen === 0 ? (
          '免费'
        ) : (
          <>
            {`¥${(record.price_fen / 100).toFixed(2)}`}
            {record.original_price_fen > record.price_fen && (
              <del
                style={{ marginLeft: 8, color: '#999' }}
              >{`¥${(record.original_price_fen / 100).toFixed(2)}`}</del>
            )}
          </>
        ),
    },
    {
      title: '自动续费',
      dataIndex: 'auto_renew_enabled',
      render: (_, record) => (record.auto_renew_enabled ? '支持' : '不支持'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={async () => {
              try {
                await updateVipPlanStatus(
                  record.id,
                  record.status === 1 ? 0 : 1,
                );
                message.success('状态已更新');
                actionRef.current?.reload();
              } catch (error) {
                message.error(
                  error instanceof Error ? error.message : '状态更新失败',
                );
              }
            }}
          >
            {record.status === 1 ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <PageContainer
      title="会员套餐"
      subTitle="配置 VIP 价格、周期和自动续费能力"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          新增套餐
        </Button>
      }
    >
      <ProTable<VipPlan>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listVipPlans();
          return { data: result.items, success: true };
        }}
        search={false}
        pagination={false}
        toolBarRender={() => []}
      />
      <ModalForm<VipPlanForm>
        title={editing ? '编辑会员套餐' : '新增会员套餐'}
        open={open}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                description: editing.description,
                billing_cycle: editing.billing_cycle,
                plan_type:
                  editing.plan_type ||
                  (editing.auto_renew_enabled ? 'auto_renew' : 'normal'),
                duration_days: editing.duration_days,
                price_fen: editing.price_fen,
                original_price_fen: editing.original_price_fen || 0,
                auto_renew_enabled: editing.auto_renew_enabled ? 1 : 0,
                sort_order: editing.sort_order,
              }
            : {
                billing_cycle: 'month',
                plan_type: 'normal',
                duration_days: 30,
                price_fen: 0,
                original_price_fen: 0,
                auto_renew_enabled: 0,
                sort_order: 0,
              }
        }
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(undefined);
        }}
        onFinish={handleSubmit}
      >
        {editing && (
          <ProFormText
            name="code"
            label="套餐编码"
            disabled
            extra="套餐编码由系统自动生成，不可修改"
          />
        )}
        <ProFormText
          name="name"
          label="套餐名称"
          rules={[{ required: true, message: '请输入套餐名称' }]}
        />
        <ProFormText name="description" label="套餐说明" />
        <ProFormSelect
          name="plan_type"
          label="套餐类型"
          options={[
            { label: '普通套餐（不需要自动续费协议）', value: 'normal' },
            { label: '自动续费套餐', value: 'auto_renew' },
          ]}
          rules={[{ required: true, message: '请选择套餐类型' }]}
        />
        <ProFormSelect
          name="billing_cycle"
          label="计费周期"
          options={[
            { label: '月度', value: 'month' },
            { label: '季度', value: 'quarter' },
            { label: '年度', value: 'year' },
            { label: '自定义', value: 'custom' },
          ]}
          rules={[{ required: true, message: '请选择计费周期' }]}
        />
        <ProFormDigit
          name="duration_days"
          label="有效天数"
          min={1}
          max={36500}
          precision={0}
          rules={[{ required: true, message: '请输入有效天数' }]}
        />
        <ProFormDigit
          name="price_fen"
          label="价格（分）"
          min={0}
          precision={0}
          rules={[{ required: true, message: '请输入价格，免费套餐填写 0' }]}
        />
        <ProFormDigit
          name="original_price_fen"
          label="原价（分）"
          min={0}
          precision={0}
          extra="填写 0 表示不展示原价；原价不能低于现价。"
        />
        <ProFormDigit name="sort_order" label="排序" min={0} precision={0} />
      </ModalForm>
    </PageContainer>
  );
};

export default VipPlans;
