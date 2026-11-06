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
import {
  App,
  Button,
  Cascader,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  type AttributeGroup,
  type AttributeGroupFormValues,
  type CategoryAttributeBinding,
  type CategoryGroupBinding,
  type GroupAttribute,
  bindCategoryGroup,
  createAttributeGroup,
  deleteAttributeGroup,
  deleteGroupAttribute,
  listAttributeGroups,
  listCategoryAttributeBindings,
  listAttributes,
  listGroupCategories,
  listGroupAttributes,
  saveGroupAttribute,
  saveCategoryAttributeBinding,
  unbindCategoryGroup,
  updateAttributeGroup,
} from '@/services/attributes';
import { listCategories } from '@/services/categories';

type CategoryOption = {
  value: number;
  label: string;
  children?: CategoryOption[];
};

function buildCategoryOptions(
  categories: { id: number; parent_id: number; name: string }[],
) {
  const options = new Map<number, CategoryOption>();
  const children = new Map<number, CategoryOption[]>();
  categories.forEach((category) => {
    options.set(category.id, { value: category.id, label: category.name });
    const siblings = children.get(category.parent_id) || [];
    const option = options.get(category.id);
    if (option) siblings.push(option);
    children.set(category.parent_id, siblings);
  });
  options.forEach((option, id) => {
    const nested = children.get(id);
    if (nested?.length) option.children = nested;
  });
  const rootOptions = children.get(0);
  if (rootOptions?.length) return rootOptions;
  return categories
    .filter((category) => !options.has(category.parent_id))
    .map((category) => options.get(category.id))
    .filter((option): option is CategoryOption => Boolean(option));
}

const AttributeGroups: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const attributeActionRef = useRef<ActionType | undefined>(undefined);
  const categoryActionRef = useRef<ActionType | undefined>(undefined);
  const [attributeItems, setAttributeItems] = useState<
    { id: number; code: string; name: string; status: number }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: number; parent_id: number; name: string }[]
  >([]);
  const [editingGroup, setEditingGroup] = useState<AttributeGroup>();
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [attributeDrawerGroup, setAttributeDrawerGroup] =
    useState<AttributeGroup>();
  const [categoryDrawerGroup, setCategoryDrawerGroup] =
    useState<AttributeGroup>();
  const [selectedAttributeId, setSelectedAttributeId] = useState<number>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [groupAttributes, setGroupAttributes] = useState<GroupAttribute[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupBinding[]>(
    [],
  );
  const [overrideCategoryId, setOverrideCategoryId] = useState<number>();
  const [categoryAttributes, setCategoryAttributes] = useState<
    CategoryAttributeBinding[]
  >([]);

  const reloadGroups = async () => {
    await listAttributeGroups();
    actionRef.current?.reload();
  };

  useEffect(() => {
    Promise.all([listAttributes(), listCategories()])
      .then(([attributeResult, categoryResult]) => {
        setAttributeItems(
          attributeResult.items.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            status: item.status,
          })),
        );
        setCategories(
          categoryResult.items.map((item) => ({
            id: item.id,
            parent_id: item.parent_id,
            name: item.name,
          })),
        );
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '加载分组数据失败');
      });
  }, [message]);

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const categoryByID = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const selectedCategoryPath = useMemo(() => {
    if (!selectedCategoryId) return [];
    const path: number[] = [];
    const visited = new Set<number>();
    let currentID: number | undefined = selectedCategoryId;
    while (currentID && !visited.has(currentID)) {
      visited.add(currentID);
      path.unshift(currentID);
      const parentID: number | undefined = categoryByID.get(currentID)?.parent_id;
      currentID = parentID && parentID !== 0 ? parentID : undefined;
    }
    return path;
  }, [categoryByID, selectedCategoryId]);

  const openAttributeDrawer = async (group: AttributeGroup) => {
    setAttributeDrawerGroup(group);
    try {
      const result = await listGroupAttributes(group.id);
      setGroupAttributes(result.items);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取分组属性失败');
    }
  };

  const refreshGroupAttributes = async () => {
    if (!attributeDrawerGroup) return;
    const result = await listGroupAttributes(attributeDrawerGroup.id);
    setGroupAttributes(result.items);
    attributeActionRef.current?.reload();
    actionRef.current?.reload();
  };

  const handleSaveGroupAttribute = async () => {
    if (!attributeDrawerGroup || !selectedAttributeId) return;
    try {
      await saveGroupAttribute({
        group_id: attributeDrawerGroup.id,
        attribute_id: selectedAttributeId,
      });
      message.success('属性已加入分组');
      setSelectedAttributeId(undefined);
      await refreshGroupAttributes();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加入分组失败');
    }
  };

  const handleDeleteGroupAttribute = async (attributeId: number) => {
    if (!attributeDrawerGroup) return;
    try {
      await deleteGroupAttribute(attributeDrawerGroup.id, attributeId);
      message.success('属性已移出分组');
      await refreshGroupAttributes();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '移出分组失败');
    }
  };

  const openCategoryDrawer = async (group: AttributeGroup) => {
    setCategoryDrawerGroup(group);
    setSelectedCategoryId(undefined);
  };

  useEffect(() => {
    if (!categoryDrawerGroup) {
      setCategoryGroups([]);
      return;
    }
    listGroupCategories(categoryDrawerGroup.id)
      .then((result) => setCategoryGroups(result.items))
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '获取分组已绑定类目失败');
      });
  }, [categoryDrawerGroup, message]);

  const handleBindCategory = async () => {
    if (!categoryDrawerGroup || !selectedCategoryId) return;
    try {
      await bindCategoryGroup({
        category_id: selectedCategoryId,
        group_id: categoryDrawerGroup.id,
      });
      message.success('分组已绑定到类目');
      const result = await listGroupCategories(categoryDrawerGroup.id);
      setCategoryGroups(result.items);
      reloadGroups();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '绑定类目分组失败');
    }
  };

  const handleUnbindCategory = async (categoryId: number, groupId: number) => {
    try {
      await unbindCategoryGroup(categoryId, groupId);
      message.success('类目分组绑定已解除');
      if (categoryDrawerGroup) {
        const result = await listGroupCategories(categoryDrawerGroup.id);
        setCategoryGroups(result.items);
      }
      reloadGroups();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解除类目分组失败');
    }
  };

  const openCategoryAttributes = async (categoryId: number) => {
    try {
      const result = await listCategoryAttributeBindings(categoryId);
      setOverrideCategoryId(categoryId);
      setCategoryAttributes(result.items);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取类目属性失败');
    }
  };

  const handleRequiredChange = async (
    record: CategoryAttributeBinding,
    isRequired: number,
  ) => {
    try {
      await saveCategoryAttributeBinding({
        category_id: record.category_id,
        attribute_id: record.attribute_id,
        group_id: record.group_id,
        group_name: record.group_name,
        is_required: isRequired,
        is_filterable: record.is_filterable,
        is_searchable: record.is_searchable,
        sort_order: record.sort_order,
      });
      setCategoryAttributes((current) =>
        current.map((item) =>
          item.attribute_id === record.attribute_id
            ? { ...item, is_required: isRequired }
            : item,
        ),
      );
      message.success('类目属性配置已更新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新类目属性失败');
    }
  };

  const handleGroupSubmit = async (values: AttributeGroupFormValues) => {
    try {
      const data = {
        name: values.name,
        display_name: values.display_name,
        sort_order: Number(values.sort_order || 0),
        status: values.status === undefined ? 1 : Number(values.status),
      };
      if (editingGroup) {
        await updateAttributeGroup(editingGroup.id, data);
        message.success('分组已更新');
      } else {
        await createAttributeGroup(data);
        message.success('分组已创建');
      }
      await reloadGroups();
      setGroupFormOpen(false);
      setEditingGroup(undefined);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存分组失败');
      return false;
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteAttributeGroup(id);
      message.success('分组已删除');
      await reloadGroups();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除分组失败');
    }
  };

  const groupColumns: ProColumns<AttributeGroup>[] = [
    { title: '系统编码', dataIndex: 'code', copyable: true },
    { title: '分组名称（内部）', dataIndex: 'name' },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      render: (_, record) => record.display_name || record.name,
    },
    { title: '属性数', dataIndex: 'attribute_count', width: 90 },
    { title: '绑定类目数', dataIndex: 'category_count', width: 110 },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button key="attributes" type="link" onClick={() => openAttributeDrawer(record)}>
          管理属性
        </Button>,
        <Button key="categories" type="link" onClick={() => openCategoryDrawer(record)}>
          绑定类目
        </Button>,
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setEditingGroup(record);
            setGroupFormOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除这个分组吗？"
          description="已有属性或绑定类目的分组不能删除。"
          okText="删除"
          cancelText="取消"
          onConfirm={() => handleDeleteGroup(record.id)}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const attributeColumns: ProColumns<GroupAttribute>[] = [
    { title: '编码', dataIndex: 'code', copyable: true },
    { title: '属性名称', dataIndex: 'name' },
    { title: '输入方式', dataIndex: 'input_type' },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Popconfirm
          title="确认移出这个分组吗？"
          okText="移出"
          cancelText="取消"
          onConfirm={() => handleDeleteGroupAttribute(record.attribute_id)}
        >
          <Button type="link" danger>
            移出
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const categoryColumns: ProColumns<CategoryGroupBinding>[] = [
    { title: '类目', dataIndex: 'category_name' },
    { title: '属性数', dataIndex: 'attribute_count', width: 90 },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, record) => (record.status === 1 ? '正常' : '禁用'),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="configure"
          type="link"
          onClick={() => openCategoryAttributes(record.category_id)}
        >
          配置属性
        </Button>,
        <Popconfirm
          key="unbind"
          title="确认解除这个类目绑定吗？"
          okText="解除"
          cancelText="取消"
          onConfirm={() => handleUnbindCategory(record.category_id, record.group_id)}
        >
          <Button type="link" danger>
            解除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const categoryAttributeColumns: ProColumns<CategoryAttributeBinding>[] = [
    { title: '属性', dataIndex: 'attribute_name' },
    {
      title: '分组',
      dataIndex: 'group_display_name',
      render: (_, record) => record.group_display_name || record.group_name || '-',
    },
    {
      title: '是否必填',
      dataIndex: 'is_required',
      render: (_, record) => (
        <Select
          value={record.is_required}
          options={[{ label: '否', value: 0 }, { label: '是', value: 1 }]}
          onChange={(value) => handleRequiredChange(record, Number(value))}
        />
      ),
    },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
  ];

  const selectedAttributeIDs = new Set(groupAttributes.map((item) => item.attribute_id));
  const availableAttributes = attributeItems
    .filter((item) => !selectedAttributeIDs.has(item.id) && item.status === 1)
    .map((item) => ({ label: `${item.name}（${item.code}）`, value: item.id }));
  return (
    <PageContainer
      title="属性分组"
      subTitle="维护可复用属性分组、分组属性以及分组与叶子类目的绑定关系"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingGroup(undefined);
            setGroupFormOpen(true);
          }}
        >
          新增分组
        </Button>
      }
    >
      <ProTable<AttributeGroup>
        actionRef={actionRef}
        rowKey="id"
        columns={groupColumns}
        request={async () => {
          const result = await listAttributeGroups();
          return { data: result.items, success: true };
        }}
        search={false}
        pagination={false}
        toolBarRender={() => []}
      />

      <ModalForm<AttributeGroupFormValues>
        key={editingGroup?.id ?? 'group-create'}
        title={editingGroup ? '编辑属性分组' : '新增属性分组'}
        open={groupFormOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editingGroup
            ? {
                name: editingGroup.name,
                display_name: editingGroup.display_name,
                sort_order: editingGroup.sort_order,
                status: editingGroup.status,
              }
            : { display_name: '', sort_order: 0, status: 1 }
        }
        onOpenChange={(open) => {
          setGroupFormOpen(open);
          if (!open) setEditingGroup(undefined);
        }}
        onFinish={handleGroupSubmit}
      >
        <ProFormText
          name="name"
          label="分组名称（内部）"
          tooltip="用于区分相似分组，不直接作为前端展示名称。"
          rules={[{ required: true }]}
        />
        <ProFormText
          name="display_name"
          label="显示名称"
          tooltip="前端展示给用户的分组名称。"
          rules={[{ required: true }]}
        />
        <ProFormDigit name="sort_order" label="排序值" min={0} precision={0} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[{ label: '正常', value: 1 }, { label: '禁用', value: 0 }]}
          rules={[{ required: true }]}
        />
      </ModalForm>

      <Drawer
        title={
          attributeDrawerGroup
            ? `管理分组属性：${attributeDrawerGroup.display_name || attributeDrawerGroup.name}`
            : '管理分组属性'
        }
        open={Boolean(attributeDrawerGroup)}
        width={820}
        onClose={() => {
          setAttributeDrawerGroup(undefined);
          setSelectedAttributeId(undefined);
        }}
      >
        {attributeDrawerGroup && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Select
                style={{ width: 360 }}
                placeholder="选择要加入分组的属性"
                value={selectedAttributeId}
                options={availableAttributes}
                onChange={setSelectedAttributeId}
                allowClear
              />
              <Button type="primary" onClick={handleSaveGroupAttribute} disabled={!selectedAttributeId}>
                加入分组
              </Button>
            </Space>
            <ProTable<GroupAttribute>
              actionRef={attributeActionRef}
              rowKey={(record) => `${record.group_id}-${record.attribute_id}`}
              columns={attributeColumns}
              dataSource={groupAttributes}
              search={false}
              pagination={false}
              options={false}
            />
          </>
        )}
      </Drawer>

      <Drawer
        title="类目属性配置"
        open={Boolean(overrideCategoryId)}
        width={720}
        onClose={() => {
          setOverrideCategoryId(undefined);
          setCategoryAttributes([]);
        }}
      >
        <ProTable<CategoryAttributeBinding>
          rowKey={(record) => `${record.category_id}-${record.attribute_id}`}
          columns={categoryAttributeColumns}
          dataSource={categoryAttributes}
          search={false}
          pagination={false}
          options={false}
        />
      </Drawer>

      <Drawer
        title={
          categoryDrawerGroup
            ? `绑定类目：${categoryDrawerGroup.display_name || categoryDrawerGroup.name}`
            : '绑定类目'
        }
        open={Boolean(categoryDrawerGroup)}
        width={820}
        onClose={() => {
          setCategoryDrawerGroup(undefined);
          setSelectedCategoryId(undefined);
          setCategoryGroups([]);
        }}
      >
        {categoryDrawerGroup && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Cascader
                style={{ width: 320 }}
                placeholder="选择末级类目"
                value={selectedCategoryPath}
                options={categoryOptions}
                changeOnSelect={false}
                allowClear
                onChange={(value) => {
                  const last = value[value.length - 1];
                  setSelectedCategoryId(typeof last === 'number' ? last : undefined);
                }}
              />
              <Button type="primary" onClick={handleBindCategory} disabled={!selectedCategoryId}>
                绑定当前类目
              </Button>
            </Space>
            <ProTable<CategoryGroupBinding>
              actionRef={categoryActionRef}
              rowKey={(record) => `${record.category_id}-${record.group_id}`}
              columns={categoryColumns}
              dataSource={categoryGroups}
              search={false}
              pagination={false}
              options={false}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              当前分组可复用到其他叶子类目；绑定后该分组中的全部属性会出现在类目属性配置中。
            </div>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default AttributeGroups;
