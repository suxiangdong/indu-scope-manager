import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormCascader,
  ProFormDigit,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { type CategoryListItem, listCategories } from '@/services/categories';
import {
  createHotCategory,
  deleteHotCategory,
  type HotCategory,
  type HotCategoryFilters,
  type HotCategoryFormValues,
  listHotCategories,
  updateHotCategory,
  updateHotCategoryStatus,
} from '@/services/hotCategories';

type HotCategoryFormInput = Omit<HotCategoryFormValues, 'category_id'> & {
  category_id: number | number[];
};

type CategoryCascaderOption = {
  value: number;
  label: string;
  children?: CategoryCascaderOption[];
};

function buildCategoryOptions(
  items: CategoryListItem[],
): CategoryCascaderOption[] {
  const activeItems = items.filter((item) => item.status === 1);
  const options = new Map<number, CategoryCascaderOption>();
  const children = new Map<number, CategoryCascaderOption[]>();

  activeItems.forEach((item) => {
    const option: CategoryCascaderOption = { value: item.id, label: item.name };
    options.set(item.id, option);
    const siblings = children.get(item.parent_id) || [];
    siblings.push(option);
    children.set(item.parent_id, siblings);
  });

  options.forEach((option, id) => {
    const nested = children.get(id);
    if (nested?.length) {
      option.children = nested;
    }
  });

  const rootOptions = children.get(0);
  if (rootOptions?.length) return rootOptions;
  return activeItems
    .filter((item) => !options.has(item.parent_id))
    .map((item) => options.get(item.id))
    .filter((option): option is CategoryCascaderOption => Boolean(option));
}

function getCategoryPath(id: number, items: CategoryListItem[]): number[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const path: number[] = [];
  const visited = new Set<number>();
  let current = byId.get(id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

const HotCategories: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HotCategory>();

  useEffect(() => {
    listCategories()
      .then((result) => setCategories(result.items))
      .catch((error) =>
        message.error(error instanceof Error ? error.message : '加载类目失败'),
      );
  }, [message]);

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: HotCategory) => {
    setEditing(record);
    setFormOpen(true);
  };

  const handleSubmit = async (values: HotCategoryFormInput) => {
    try {
      const selectedPath = Array.isArray(values.category_id)
        ? values.category_id
        : [values.category_id];
      const categoryID = Number(selectedPath[selectedPath.length - 1]);
      if (!Number.isFinite(categoryID) || categoryID <= 0) {
        message.error('请选择末级工业品分类');
        return false;
      }
      const data = {
        category_id: categoryID,
        sort_order: Number(values.sort_order || 0),
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editing) {
        await updateHotCategory(editing.id, data);
        message.success('热门分类已更新');
      } else {
        await createHotCategory(data);
        message.success('热门分类已创建');
      }
      setFormOpen(false);
      setEditing(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '保存热门分类失败',
      );
      return false;
    }
  };

  const changeStatus = async (record: HotCategory) => {
    try {
      await updateHotCategoryStatus(record.id, record.status === 1 ? 0 : 1);
      message.success(
        record.status === 1 ? '热门分类已禁用' : '热门分类已启用',
      );
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '更新热门分类状态失败',
      );
    }
  };

  const columns: ProColumns<HotCategory>[] = [
    {
      title: '分类名称',
      dataIndex: 'keyword',
      ellipsis: true,
      render: (_, record) => record.name,
    },
    { title: '排序', dataIndex: 'sort_order', width: 100, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: { 1: '启用', 0: '禁用' },
      width: 110,
      search: true,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '启用' : '禁用'}
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
      width: 240,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title={`确认${record.status === 1 ? '禁用' : '启用'}该热门分类吗？`}
            okText="确认"
            cancelText="取消"
            onConfirm={() => void changeStatus(record)}
          >
            <Button type="link">{record.status === 1 ? '禁用' : '启用'}</Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除这个热门分类吗？"
            description="删除后不会影响原有产品类目。"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteHotCategory(record.id);
                message.success('热门分类已删除');
                actionRef.current?.reload();
              } catch (error) {
                message.error(
                  error instanceof Error ? error.message : '删除热门分类失败',
                );
              }
            }}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="热门分类"
      subTitle="配置首页搜索区域展示的工业品分类及排序"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增热门分类
        </Button>
      }
    >
      <ProTable<HotCategory>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const filters: HotCategoryFilters = {
            keyword: params.keyword,
            status:
              params.status === undefined ? undefined : Number(params.status),
            page: params.current,
            page_size: params.pageSize,
          };
          const result = await listHotCategories(filters);
          return { data: result.items, total: result.total, success: true };
        }}
        pagination={false}
        dateFormatter="string"
      />

      <ModalForm<HotCategoryFormInput>
        key={editing?.id ?? 'create'}
        title={editing ? '编辑热门分类' : '新增热门分类'}
        open={formOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing
            ? {
                category_id: getCategoryPath(editing.category_id, categories),
                sort_order: editing.sort_order,
                status: editing.status,
              }
            : { sort_order: 0, status: 1 }
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        onFinish={handleSubmit}
      >
        <ProFormCascader
          name="category_id"
          label="工业品分类"
          placeholder="请选择末级工业品分类"
          fieldProps={{
            options: categoryOptions,
            showSearch: true,
            changeOnSelect: false,
            expandTrigger: 'click',
          }}
          rules={[{ required: true, message: '请选择工业品分类' }]}
        />
        <ProFormDigit
          name="sort_order"
          label="排序值"
          tooltip="数值越小越靠前"
          min={0}
          precision={0}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default HotCategories;
