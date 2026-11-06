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
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';

import {
  createStorePlatform,
  deleteStorePlatform,
  listStorePlatforms,
  type StorePlatform,
  type StorePlatformFormValues,
  updateStorePlatform,
} from '@/services/storePlatforms';

const StorePlatforms: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StorePlatform>();

  const handleSubmit = async (values: StorePlatformFormValues) => {
    try {
      const data = {
        name: values.name,
        sort_order: Number(values.sort_order || 0),
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editing) {
        await updateStorePlatform(editing.id, data);
        message.success('店铺平台已更新');
      } else {
        await createStorePlatform(data);
        message.success('店铺平台已创建');
      }
      setFormOpen(false);
      setEditing(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存店铺平台失败');
      return false;
    }
  };

  const columns: ProColumns<StorePlatform>[] = [
    { title: '平台名称', dataIndex: 'name', copyable: true },
    { title: '排序', dataIndex: 'sort_order', width: 100, search: false },
    {
      title: '状态', dataIndex: 'status', width: 110, search: false,
      render: (_, record) => <Tag color={record.status === 1 ? 'success' : 'default'}>{record.status === 1 ? '启用' : '禁用'}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updated_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option', render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</Button>
          <Popconfirm
            title="确认删除这个店铺平台吗？"
            description="已被认证资料使用的平台不能删除。"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteStorePlatform(record.id);
                message.success('店铺平台已删除');
                actionRef.current?.reload();
              } catch (error) {
                message.error(error instanceof Error ? error.message : '删除店铺平台失败');
              }
            }}
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="店铺平台"
      subTitle="维护个人认证可选择的店铺平台"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新增平台</Button>}
    >
      <ProTable<StorePlatform>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listStorePlatforms();
          return { data: result.items, success: true };
        }}
        search={false}
        pagination={false}
        dateFormatter="string"
        toolBarRender={() => []}
      />

      <ModalForm<StorePlatformFormValues>
        key={editing?.id ?? 'create'}
        title={editing ? '编辑店铺平台' : '新增店铺平台'}
        open={formOpen}
        width={480}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ? { name: editing.name, sort_order: editing.sort_order, status: editing.status } : { sort_order: 0, status: 1 }}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(undefined); }}
        onFinish={handleSubmit}
      >
        <ProFormText name="name" label="平台名称" placeholder="如：京东、天猫、自建网站" rules={[{ required: true, message: '请输入平台名称' }]} />
        <ProFormDigit name="sort_order" label="排序值" min={0} precision={0} fieldProps={{ style: { width: '100%' } }} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} rules={[{ required: true, message: '请选择状态' }]} />
      </ModalForm>
    </PageContainer>
  );
};

export default StorePlatforms;
