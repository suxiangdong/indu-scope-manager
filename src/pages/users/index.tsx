import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';

import {
  type AdminUserFormValues,
  type AdminUserListItem,
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUser,
} from '@/services/admin';

const statusEnum = {
  1: { text: '正常', status: 'Success' },
  0: { text: '禁用', status: 'Default' },
};

const Users: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem>();

  const openCreate = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: AdminUserListItem) => {
    setEditingUser(record);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminUser(id);
      message.success('管理员已删除');
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除管理员失败');
    }
  };

  const handleSubmit = async (values: AdminUserFormValues) => {
    try {
      const data = {
        ...values,
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editingUser) {
        await updateAdminUser(editingUser.id, data);
        message.success('管理员信息已更新');
      } else {
        await createAdminUser({
          username: data.username,
          name: data.name,
          phone: data.phone,
          password: data.password || '',
          status: data.status,
        });
        message.success('管理员已创建');
      }
      actionRef.current?.reload();
      setFormOpen(false);
      setEditingUser(undefined);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存管理员失败');
      return false;
    }
  };

  const columns: ProColumns<AdminUserListItem>[] = [
    {
      title: '账号',
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最近登录',
      dataIndex: 'last_login_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button key="edit" type="link" onClick={() => openEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除这个管理员吗？"
          description="删除后账号将无法登录，且不可恢复。"
          okText="删除"
          cancelText="取消"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      title="管理员账号"
      subTitle="管理后台登录账号、联系方式和账号状态"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增管理员
        </Button>
      }
    >
      <ProTable<AdminUserListItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listAdminUsers();
          return {
            data: result.items,
            success: true,
          };
        }}
        search={false}
        pagination={false}
        dateFormatter="string"
        toolBarRender={() => []}
      />

      <ModalForm<AdminUserFormValues>
        key={editingUser?.id ?? 'create'}
        title={editingUser ? '编辑管理员' : '新增管理员'}
        open={formOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editingUser
            ? {
                username: editingUser.username,
                name: editingUser.name,
                phone: editingUser.phone,
                status: editingUser.status,
              }
            : { status: 1 }
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingUser(undefined);
        }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="username"
          label="管理员账号"
          placeholder="请输入登录账号"
          rules={[{ required: true, message: '请输入管理员账号' }]}
        />
        <ProFormText
          name="name"
          label="姓名"
          placeholder="请输入管理员姓名"
          rules={[{ required: true, message: '请输入管理员姓名' }]}
        />
        <ProFormText
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          rules={[{ required: true, message: '请输入手机号' }]}
        />
        <ProFormText.Password
          name="password"
          label="登录密码"
          placeholder={editingUser ? '不修改密码时留空' : '请输入至少 6 位密码'}
          rules={
            editingUser ? [] : [{ required: true, message: '请输入登录密码' }]
          }
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择账号状态' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Users;
