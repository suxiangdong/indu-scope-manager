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
import { App, Button, Cascader, Drawer, Popconfirm, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryListItem } from '@/services/categories';
import { listCategories } from '@/services/categories';
import {
  bindStockUnitCategory,
  createStockUnit,
  deleteStockUnit,
  listStockUnitCategories,
  listStockUnits,
  type StockUnit,
  type StockUnitCategory,
  type StockUnitFormValues,
  unbindStockUnitCategory,
  updateStockUnit,
} from '@/services/stockUnits';

type CategoryOption = {
  value: number;
  label: string;
  children?: CategoryOption[];
};

function buildCategoryOptions(categories: CategoryListItem[]) {
  const options = new Map<number, CategoryOption>();
  const children = new Map<number, CategoryOption[]>();
  categories.forEach((category) => {
    const option = { value: category.id, label: category.name };
    options.set(category.id, option);
    const siblings = children.get(category.parent_id) || [];
    siblings.push(option);
    children.set(category.parent_id, siblings);
  });
  options.forEach((option, id) => {
    const nested = children.get(id);
    if (nested?.length) option.children = nested;
  });
  return children.get(0) || [];
}

const StockUnits: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const categoryRequestRef = useRef(0);
  const categoryUnitIdRef = useRef<number | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockUnit>();
  const [categoryDrawerUnit, setCategoryDrawerUnit] = useState<StockUnit>();
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [boundCategories, setBoundCategories] = useState<StockUnitCategory[]>(
    [],
  );
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>(
    [],
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryMutating, setCategoryMutating] = useState(false);

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

  const refreshBoundCategories = async (unitId: number) => {
    if (categoryUnitIdRef.current !== unitId) return;
    const requestId = ++categoryRequestRef.current;
    setCategoryLoading(true);
    try {
      const result = await listStockUnitCategories(unitId);
      if (requestId === categoryRequestRef.current)
        setBoundCategories(result.items);
    } catch (error) {
      if (requestId === categoryRequestRef.current) throw error;
    } finally {
      if (requestId === categoryRequestRef.current) setCategoryLoading(false);
    }
  };

  const openCategoryDrawer = async (record: StockUnit) => {
    categoryUnitIdRef.current = record.id;
    setCategoryDrawerUnit(record);
    setBoundCategories([]);
    setSelectedCategoryPath([]);
    setCategoryMutating(false);
    try {
      await refreshBoundCategories(record.id);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '获取已绑定类目失败',
      );
    }
  };

  const closeCategoryDrawer = () => {
    categoryRequestRef.current += 1;
    categoryUnitIdRef.current = undefined;
    setCategoryDrawerUnit(undefined);
    setBoundCategories([]);
    setSelectedCategoryPath([]);
    setCategoryLoading(false);
    setCategoryMutating(false);
  };

  const handleSubmit = async (values: StockUnitFormValues) => {
    try {
      const data = {
        code: values.code,
        name: values.name,
        sort_order: Number(values.sort_order || 0),
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editing) {
        await updateStockUnit(editing.id, data);
        message.success('库存单位已更新');
      } else {
        await createStockUnit(data);
        message.success('库存单位已创建');
      }
      setFormOpen(false);
      setEditing(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '保存库存单位失败',
      );
      return false;
    }
  };

  const handleBind = async () => {
    if (
      !categoryDrawerUnit ||
      selectedCategoryPath.length === 0 ||
      categoryLoading ||
      categoryMutating
    )
      return;
    const unitId = categoryDrawerUnit.id;
    const categoryId = selectedCategoryPath[selectedCategoryPath.length - 1];
    if (boundCategories.some((item) => item.category_id === categoryId)) {
      message.info('该类目已绑定');
      return;
    }
    setCategoryMutating(true);
    try {
      await bindStockUnitCategory({
        stock_unit_id: unitId,
        category_id: categoryId,
      });
      message.success('库存单位已绑定到类目');
      if (categoryUnitIdRef.current === unitId) {
        setSelectedCategoryPath([]);
        await refreshBoundCategories(unitId);
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '绑定库存单位类目失败',
      );
    } finally {
      if (categoryUnitIdRef.current === unitId) setCategoryMutating(false);
    }
  };

  const columns: ProColumns<StockUnit>[] = [
    { title: '单位编码', dataIndex: 'code', copyable: true },
    { title: '单位名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort_order', width: 90, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
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
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => void openCategoryDrawer(record)}>
            绑定类目
          </Button>
          <Button
            type="link"
            onClick={() => {
              setEditing(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除这个库存单位吗？"
            description="已被产品使用的库存单位不能删除。"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteStockUnit(record.id);
                message.success('库存单位已删除');
                actionRef.current?.reload();
              } catch (error) {
                message.error(
                  error instanceof Error ? error.message : '删除库存单位失败',
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
      title="库存单位"
      subTitle="维护产品库存单位，并按类目控制可选单位"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          新增单位
        </Button>
      }
    >
      <ProTable<StockUnit>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listStockUnits();
          return { data: result.items, success: true };
        }}
        search={false}
        pagination={false}
        dateFormatter="string"
        toolBarRender={() => []}
      />

      <ModalForm<StockUnitFormValues>
        key={editing?.id ?? 'create'}
        title={editing ? '编辑库存单位' : '新增库存单位'}
        open={formOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
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
        <ProFormText
          name="code"
          label="单位编码"
          placeholder="如：kg、piece、box"
          rules={[{ required: true, message: '请输入单位编码' }]}
        />
        <ProFormText
          name="name"
          label="单位名称"
          placeholder="如：千克、件、箱"
          rules={[{ required: true, message: '请输入单位名称' }]}
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
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>

      <Drawer
        title={
          categoryDrawerUnit
            ? `绑定类目 · ${categoryDrawerUnit.name}`
            : '绑定类目'
        }
        width={560}
        open={Boolean(categoryDrawerUnit)}
        onClose={closeCategoryDrawer}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Cascader
              style={{ flex: 1 }}
              options={categoryOptions}
              value={selectedCategoryPath}
              onChange={(value) => setSelectedCategoryPath(value as number[])}
              placeholder="选择末级类目"
              disabled={categoryLoading || categoryMutating}
            />
            <Button
              type="primary"
              onClick={() => void handleBind()}
              disabled={
                !selectedCategoryPath.length ||
                categoryLoading ||
                categoryMutating
              }
            >
              绑定
            </Button>
          </Space.Compact>
          <ProTable<StockUnitCategory>
            rowKey="category_id"
            columns={[
              { title: '类目', dataIndex: 'category_name' },
              { title: '排序', dataIndex: 'sort_order', width: 80 },
              {
                title: '操作',
                valueType: 'option',
                render: (_, record) => (
                  <Popconfirm
                    title="确认解除绑定吗？"
                    okText="解除"
                    cancelText="取消"
                    onConfirm={async () => {
                      if (
                        !categoryDrawerUnit ||
                        categoryLoading ||
                        categoryMutating
                      )
                        return;
                      const unitId = categoryDrawerUnit.id;
                      setCategoryMutating(true);
                      try {
                        await unbindStockUnitCategory(
                          unitId,
                          record.category_id,
                        );
                        message.success('绑定已解除');
                        await refreshBoundCategories(unitId);
                      } catch (error) {
                        message.error(
                          error instanceof Error
                            ? error.message
                            : '解除绑定失败',
                        );
                      } finally {
                        if (categoryUnitIdRef.current === unitId)
                          setCategoryMutating(false);
                      }
                    }}
                  >
                    <Button
                      type="link"
                      danger
                      disabled={categoryLoading || categoryMutating}
                    >
                      解除
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
            dataSource={boundCategories}
            loading={categoryLoading}
            search={false}
            pagination={false}
            options={false}
            toolBarRender={false}
          />
        </Space>
      </Drawer>
    </PageContainer>
  );
};

export default StockUnits;
