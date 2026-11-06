import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Tag } from 'antd';
import React, { useRef, useState } from 'react';

import {
  listCustomerUsers,
  type CustomerUser,
  updateCustomerUserStatus,
} from '@/services/customerUsers';

const statusOptions = [
  { label: '未认证', value: 0 },
  { label: '已认证', value: 1 },
  { label: '已禁用', value: 2 },
];

const verificationStatusLabels: Record<string, { text: string; color: string }> = {
  unsubmitted: { text: '未提交', color: 'default' },
  pending: { text: '审核中', color: 'processing' },
  rejected: { text: '已驳回', color: 'error' },
  verified: { text: '已通过', color: 'success' },
};

function statusLabel(status: number) {
  return statusOptions.find((item) => item.value === status)?.label || '未知';
}

const CustomerUsers: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomerUser>();

  const openStatusForm = (record: CustomerUser) => {
    setEditingUser(record);
    setStatusFormOpen(true);
  };

  const handleStatusSubmit = async (values: { status: number }) => {
    if (!editingUser) return false;
    try {
      await updateCustomerUserStatus(editingUser.id, Number(values.status));
      message.success('用户状态已更新');
      setStatusFormOpen(false);
      setEditingUser(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '修改用户状态失败');
      return false;
    }
  };

  const columns: ProColumns<CustomerUser>[] = [
    { title: '用户 ID', dataIndex: 'id', width: 90, search: false },
    { title: '手机号', dataIndex: 'phone', copyable: true },
    {
      title: '角色', dataIndex: 'role', valueType: 'select', valueEnum: { 0: '待完善', 1: '采购方', 2: '供应方' },
      render: (_, record) => record.role === 0 ? '待完善' : record.role === 1 ? '采购方' : '供应方',
    },
    {
      title: '用户类型', dataIndex: 'user_type', valueType: 'select', valueEnum: { 1: '个人', 2: '企业' },
      render: (_, record) => record.user_type === 1 ? '个人' : '企业',
    },
    {
      title: '账号状态', dataIndex: 'status', valueType: 'select', valueEnum: { 0: '未认证', 1: '已认证', 2: '已禁用' }, search: true,
      render: (_, record) => <Tag color={record.status === 2 ? 'error' : record.status === 1 ? 'success' : 'default'}>{statusLabel(record.status)}</Tag>,
    },
    {
      title: '认证状态', dataIndex: 'verification_status', search: false,
      render: (_, record) => {
        const item = verificationStatusLabels[record.verification_status] || { text: record.verification_status, color: 'default' };
        return <Tag color={item.color}>{item.text}{record.verification_type ? ` · ${record.verification_type === 'company' ? '企业' : '个人'}` : ''}</Tag>;
      },
    },
    { title: '微信绑定', dataIndex: 'wechat_bound', search: false, render: (_, record) => record.wechat_bound ? '已绑定' : '未绑定' },
    { title: '注册时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option', render: (_, record) => <Button type="link" onClick={() => openStatusForm(record)}>修改状态</Button>,
    },
  ];

  return (
    <PageContainer title="用户管理" subTitle="查看前端用户、认证状态和账号状态">
      <ProTable<CustomerUser>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const result = await listCustomerUsers({
            phone: params.phone,
            role: params.role === undefined ? undefined : Number(params.role),
            user_type: params.user_type === undefined ? undefined : Number(params.user_type),
            status: params.status === undefined ? undefined : Number(params.status),
          });
          return { data: result.items, success: true };
        }}
        pagination={false}
        dateFormatter="string"
      />

      <ModalForm<{ status: number }>
        key={editingUser?.id ?? 'status'}
        title={editingUser ? `修改用户 ${editingUser.phone} 状态` : '修改用户状态'}
        open={statusFormOpen}
        width={420}
        modalProps={{ destroyOnClose: true }}
        initialValues={{ status: editingUser?.status ?? 0 }}
        onOpenChange={(open) => { setStatusFormOpen(open); if (!open) setEditingUser(undefined); }}
        onFinish={handleStatusSubmit}
      >
        <ProFormSelect name="status" label="账号状态" options={statusOptions} rules={[{ required: true, message: '请选择账号状态' }]} />
      </ModalForm>
    </PageContainer>
  );
};

export default CustomerUsers;
