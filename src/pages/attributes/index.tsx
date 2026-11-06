import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Drawer, Popconfirm, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

import {
  type AttributeFormValues,
  type AttributeGroup,
  type AttributeListItem,
  type AttributeOption,
  type AttributeOptionFormValues,
  createAttribute,
  createAttributeOption,
  deleteAttribute,
  deleteAttributeOption,
  listAttributeGroups,
  listAttributeOptions,
  listAttributes,
  updateAttribute,
  updateAttributeOption,
} from '@/services/attributes';

const valueTypeOptions = [
  { label: '文本', value: 1 },
  { label: '整数', value: 2 },
  { label: '小数', value: 3 },
  { label: '布尔值', value: 4 },
  { label: '日期', value: 5 },
  { label: '结构化 JSON', value: 6 },
];

const inputTypeOptions = [
  { label: '单行文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字输入', value: 'number' },
  { label: '下拉单选', value: 'select' },
  { label: '下拉多选', value: 'multi_select' },
  { label: '开关', value: 'switch' },
  { label: '日期选择', value: 'date' },
];

const valueTypeLabels = new Map(
  valueTypeOptions.map((option) => [option.value, option.label]),
);
const inputTypeLabels = new Map(
  inputTypeOptions.map((option) => [option.value, option.label]),
);
const optionInputTypes = new Set(['select', 'multi_select']);

const Attributes: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const optionActionRef = useRef<ActionType | undefined>(undefined);
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] =
    useState<AttributeListItem>();
  const [optionsAttribute, setOptionsAttribute] =
    useState<AttributeListItem>();
  const [optionFormOpen, setOptionFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<AttributeOption>();

  useEffect(() => {
    listAttributeGroups()
      .then((result) => setGroups(result.items))
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '获取属性分组失败');
      });
  }, [message]);

  const groupOptions = groups.map((group) => ({
    label: group.name,
    value: group.id,
    disabled: group.status !== 1,
  }));

  const openCreate = () => {
    setEditingAttribute(undefined);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAttribute(id);
      message.success('属性已删除');
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除属性失败');
    }
  };

  const handleSubmit = async (values: AttributeFormValues) => {
    const data = {
      name: values.name,
      value_type: Number(values.value_type),
      input_type: values.input_type,
      unit: values.unit || '',
      placeholder: values.placeholder || '',
      validation_rules: values.validation_rules || '',
      help_text: values.help_text || '',
      status: values.status === undefined ? 1 : Number(values.status),
      group_ids: (values.group_ids || []).map(Number),
    };
    try {
      if (editingAttribute) {
        await updateAttribute(editingAttribute.id, data);
        message.success('属性信息已更新');
      } else {
        await createAttribute(data);
        message.success('属性已创建');
      }
      actionRef.current?.reload();
      setFormOpen(false);
      setEditingAttribute(undefined);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存属性失败');
      return false;
    }
  };

  const openOptions = (record: AttributeListItem) => {
    setOptionsAttribute(record);
    setEditingOption(undefined);
  };

  const handleOptionSubmit = async (values: AttributeOptionFormValues) => {
    if (!optionsAttribute) return false;
    const data = {
      name: values.name,
      sort_order: Number(values.sort_order || 0),
      status: values.status === undefined ? 1 : Number(values.status),
    };
    try {
      if (editingOption) {
        await updateAttributeOption(editingOption.id, data);
        message.success('属性选项已更新');
      } else {
        await createAttributeOption({
          ...data,
          attribute_id: optionsAttribute.id,
        });
        message.success('属性选项已创建');
      }
      optionActionRef.current?.reload();
      actionRef.current?.reload();
      setOptionFormOpen(false);
      setEditingOption(undefined);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存属性选项失败');
      return false;
    }
  };

  const handleDeleteOption = async (id: number) => {
    try {
      await deleteAttributeOption(id);
      message.success('属性选项已删除');
      optionActionRef.current?.reload();
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除属性选项失败');
    }
  };

  const columns: ProColumns<AttributeListItem>[] = [
    { title: '系统编码', dataIndex: 'code', copyable: true },
    { title: '属性名称', dataIndex: 'name' },
    {
      title: '值类型',
      dataIndex: 'value_type',
      render: (_, record) => valueTypeLabels.get(record.value_type) || record.value_type,
    },
    {
      title: '输入方式',
      dataIndex: 'input_type',
      render: (_, record) => inputTypeLabels.get(record.input_type) || record.input_type,
    },
    { title: '单位', dataIndex: 'unit', render: (_, record) => record.unit || '-' },
    { title: '分组数', dataIndex: 'group_count', width: 90, search: false },
    {
      title: '选项数',
      dataIndex: 'option_count',
      width: 90,
      search: false,
      render: (_, record) =>
        optionInputTypes.has(record.input_type) ? record.option_count : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
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
        ...(optionInputTypes.has(record.input_type)
          ? [
              <Button
                key="options"
                type="link"
                onClick={() => openOptions(record)}
              >
                选项
              </Button>,
            ]
          : []),
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setEditingAttribute(record);
            setFormOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除这个属性吗？"
          description="已加入分组、绑定类目或已有产品值的属性不能删除。"
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

  const optionColumns: ProColumns<AttributeOption>[] = [
    { title: '系统编码', dataIndex: 'code', copyable: true },
    { title: '选项名称', dataIndex: 'name' },
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
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setEditingOption(record);
            setOptionFormOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除这个选项吗？"
          okText="删除"
          cancelText="取消"
          onConfirm={() => handleDeleteOption(record.id)}
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
      title="属性管理"
      subTitle="维护全局产品属性、属性选项和属性所属分组"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增属性
        </Button>
      }
    >
      <ProTable<AttributeListItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const result = await listAttributes();
          return { data: result.items, success: true };
        }}
        search={false}
        pagination={false}
        dateFormatter="string"
        toolBarRender={() => []}
      />

      <ModalForm<AttributeFormValues>
        key={editingAttribute?.id ?? 'create'}
        title={editingAttribute ? '编辑属性' : '新增属性'}
        open={formOpen}
        width={640}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editingAttribute
            ? {
                name: editingAttribute.name,
                value_type: editingAttribute.value_type,
                input_type: editingAttribute.input_type,
                unit: editingAttribute.unit,
                placeholder: editingAttribute.placeholder,
                validation_rules: editingAttribute.validation_rules,
                help_text: editingAttribute.help_text,
                status: editingAttribute.status,
                group_ids: editingAttribute.group_ids || [],
              }
            : { value_type: 1, input_type: 'text', status: 1, group_ids: [] }
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAttribute(undefined);
        }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="属性名称"
          placeholder="例如：额定电压"
          rules={[{ required: true, message: '请输入属性名称' }]}
        />
        <ProFormSelect
          name="group_ids"
          label="所属分组"
          mode="multiple"
          placeholder="可选，后续也可以在分组页面维护"
          options={groupOptions}
        />
        <ProFormSelect
          name="value_type"
          label="值类型"
          options={valueTypeOptions}
          rules={[{ required: true, message: '请选择值类型' }]}
        />
        <ProFormSelect
          name="input_type"
          label="输入方式"
          options={inputTypeOptions}
          rules={[{ required: true, message: '请选择输入方式' }]}
        />
        <ProFormText name="unit" label="单位" placeholder="例如：V、kg、mm" />
        <ProFormText name="placeholder" label="占位提示" />
        <ProFormTextArea
          name="validation_rules"
          label="校验规则 JSON"
          placeholder='例如：{"min": 0, "max": 100}'
          fieldProps={{ rows: 3 }}
        />
        <ProFormTextArea name="help_text" label="帮助说明" fieldProps={{ rows: 3 }} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>

      <Drawer
        title={optionsAttribute ? `属性选项：${optionsAttribute.name}` : '属性选项'}
        open={Boolean(optionsAttribute)}
        width={720}
        onClose={() => {
          setOptionsAttribute(undefined);
          setEditingOption(undefined);
          setOptionFormOpen(false);
        }}
      >
        {optionsAttribute && (
          <ProTable<AttributeOption>
            actionRef={optionActionRef}
            rowKey="id"
            columns={optionColumns}
            request={async () => {
              const result = await listAttributeOptions(optionsAttribute.id);
              return { data: result.items, success: true };
            }}
            search={false}
            pagination={false}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingOption(undefined);
                  setOptionFormOpen(true);
                }}
              >
                新增选项
              </Button>,
            ]}
          />
        )}
      </Drawer>

      <ModalForm<AttributeOptionFormValues>
        key={editingOption?.id ?? 'option-create'}
        title={editingOption ? '编辑属性选项' : '新增属性选项'}
        open={optionFormOpen}
        width={520}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editingOption
            ? {
                name: editingOption.name,
                sort_order: editingOption.sort_order,
                status: editingOption.status,
              }
            : { sort_order: 0, status: 1 }
        }
        onOpenChange={(open) => {
          setOptionFormOpen(open);
          if (!open) setEditingOption(undefined);
        }}
        onFinish={handleOptionSubmit}
      >
        <ProFormText
          name="name"
          label="选项名称"
          rules={[{ required: true, message: '请输入选项名称' }]}
        />
        <ProFormDigit name="sort_order" label="排序值" min={0} precision={0} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Attributes;
