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
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';

import {
  type CategoryFormValues,
  type CategoryListItem,
  type CategoryTreeNode,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/services/categories';

function buildCategoryTree(items: CategoryListItem[]): CategoryTreeNode[] {
  const nodes = new Map<number, CategoryTreeNode>();
  items.forEach((item) => {
    nodes.set(item.id, { ...item });
  });

  const roots: CategoryTreeNode[] = [];
  items.forEach((item) => {
    const node = nodes.get(item.id);
    const parentId = item.parent_id || undefined;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (node && parent) {
      parent.children = [...(parent.children || []), node];
    } else if (node) {
      roots.push(node);
    }
  });
  return roots;
}

function getCategoryPath(
  id: number,
  byId: Map<number, CategoryListItem>,
): string {
  const names: string[] = [];
  const visited = new Set<number>();
  let current = byId.get(id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return names.join(' / ');
}

function isDescendant(
  id: number,
  ancestorId: number,
  byId: Map<number, CategoryListItem>,
): boolean {
  const visited = new Set<number>();
  let current = byId.get(id);
  while (current?.parent_id && !visited.has(current.id)) {
    if (current.parent_id === ancestorId) return true;
    visited.add(current.id);
    current = byId.get(current.parent_id);
  }
  return false;
}

const Categories: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode>();
  const [categoryItems, setCategoryItems] = useState<CategoryListItem[]>([]);

  const categoryOptions = useMemo(() => {
    const byId = new Map(categoryItems.map((item) => [item.id, item]));
    const currentId = editingCategory?.id;
    return [
      { label: '无（一级类目）', value: 0 },
      ...categoryItems
        .filter(
          (item) =>
            item.id !== currentId &&
            (!currentId || !isDescendant(item.id, currentId, byId)),
        )
        .map((item) => ({
          label: getCategoryPath(item.id, byId),
          value: item.id,
        })),
    ];
  }, [categoryItems, editingCategory?.id]);

  const openCreate = (parentId?: number) => {
    setEditingCategory(
      parentId
        ? ({
            id: 0,
            parent_id: parentId,
            name: '',
            sort_order: 0,
            status: 1,
            created_at: '',
            updated_at: '',
          } as CategoryTreeNode)
        : undefined,
    );
    setFormOpen(true);
  };

  const openEdit = (record: CategoryTreeNode) => {
    setEditingCategory(record);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('类目已删除');
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除类目失败');
    }
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      const data = {
        parent_id: values.parent_id ? Number(values.parent_id) : 0,
        name: values.name,
        sort_order: Number(values.sort_order || 0),
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, data);
        message.success('类目信息已更新');
      } else {
        await createCategory({
          ...data,
          parent_id: data.parent_id || 0,
        });
        message.success('类目已创建');
      }
      actionRef.current?.reload();
      setFormOpen(false);
      setEditingCategory(undefined);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存类目失败');
      return false;
    }
  };

  const columns: ProColumns<CategoryTreeNode>[] = [
    {
      title: '类目名称',
      dataIndex: 'name',
      copyable: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 100,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button key="child" type="link" onClick={() => openCreate(record.id)}>
          新增子类目
        </Button>,
        <Button key="edit" type="link" onClick={() => openEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除这个类目吗？"
          description="只有没有子类目和产品的类目可以删除。"
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
      title="类目管理"
      subTitle="维护产品类目层级、排序和启用状态"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openCreate()}
        >
          新增一级类目
        </Button>
      }
    >
      <ProTable<CategoryTreeNode>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listCategories();
          setCategoryItems(result.items);
          return {
            data: buildCategoryTree(result.items),
            success: true,
          };
        }}
        search={false}
        pagination={false}
        dateFormatter="string"
        toolBarRender={() => []}
      />

      <ModalForm<CategoryFormValues>
        key={editingCategory?.id ?? 'create'}
        title={editingCategory?.id ? '编辑类目' : '新增类目'}
        open={formOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editingCategory?.id
            ? {
                parent_id: editingCategory.parent_id || 0,
                name: editingCategory.name,
                sort_order: editingCategory.sort_order,
                status: editingCategory.status,
              }
            : {
                parent_id: editingCategory?.parent_id || 0,
                sort_order: 0,
                status: 1,
              }
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCategory(undefined);
        }}
        onFinish={handleSubmit}
      >
        <ProFormSelect
          name="parent_id"
          label="父级类目"
          options={categoryOptions}
        />
        <ProFormText
          name="name"
          label="类目名称"
          placeholder="请输入类目名称"
          rules={[{ required: true, message: '请输入类目名称' }]}
        />
        <ProFormDigit
          name="sort_order"
          label="排序值"
          min={0}
          precision={0}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择类目状态' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Categories;
