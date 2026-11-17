import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AdminProduct,
  type AdminProductAttribute,
  getAdminProductDetail,
  listAdminProducts,
  updateAdminProductStatus,
} from '@/services/adminProducts';
import { type CategoryListItem, listCategories } from '@/services/categories';

const statusOptions = [
  { label: '审核中', value: 0 },
  { label: '已上架', value: 1 },
  { label: '已下架', value: 2 },
];

const statusMeta: Record<number, { label: string; color: string }> = {
  0: { label: '审核中', color: 'processing' },
  1: { label: '已上架', color: 'success' },
  2: { label: '已下架', color: 'default' },
};

function categoryValueEnum(categories: CategoryListItem[]) {
  return categories.reduce<Record<number, string>>((result, category) => {
    result[category.id] = category.name;
    return result;
  }, {});
}

function formatAttribute(attribute: AdminProductAttribute) {
  return attribute.unit
    ? `${attribute.value} ${attribute.unit}`
    : attribute.value;
}

const Products: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const detailRequestRef = useRef(0);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<AdminProduct>();

  useEffect(() => {
    listCategories()
      .then((result) => setCategories(result.items))
      .catch((error) =>
        message.error(error instanceof Error ? error.message : '加载类目失败'),
      );
  }, [message]);

  const categoryEnum = useMemo(
    () => categoryValueEnum(categories),
    [categories],
  );

  const openDetail = async (record: AdminProduct) => {
    const requestId = ++detailRequestRef.current;
    setDetail(undefined);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const result = await getAdminProductDetail(record.id);
      if (requestId === detailRequestRef.current) setDetail(result);
    } catch (error) {
      if (requestId !== detailRequestRef.current) return;
      message.error(
        error instanceof Error ? error.message : '获取产品详情失败',
      );
      setDetailOpen(false);
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setDetailOpen(false);
    setDetail(undefined);
    setDetailLoading(false);
  };

  const changeStatus = async (record: AdminProduct, status: number) => {
    try {
      const updated = await updateAdminProductStatus(record.id, status);
      setDetail((current) => (current?.id === updated.id ? updated : current));
      message.success(
        status === 1
          ? '产品审核已通过并上架'
          : status === 2
            ? '产品已下架'
            : '产品已退回审核',
      );
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '更新产品状态失败',
      );
    }
  };

  const columns: ProColumns<AdminProduct>[] = [
    {
      title: '产品',
      dataIndex: 'keyword',
      width: 280,
      render: (_, record) => (
        <Space align="start">
          {record.cover_url ? (
            <Image
              width={52}
              height={52}
              src={record.cover_url}
              style={{ objectFit: 'cover', borderRadius: 6 }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                background: '#f5f5f5',
                borderRadius: 6,
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ color: '#999', fontSize: 12 }}>ID: {record.id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '供应企业',
      dataIndex: 'supplier_company',
      search: false,
      ellipsis: true,
      render: (_, record) => record.supplier_company || '未填写',
    },
    {
      title: '类目',
      dataIndex: 'category_id',
      valueType: 'select',
      valueEnum: categoryEnum,
      width: 150,
      render: (_, record) =>
        record.category_name || categoryEnum[record.category_id] || '未分类',
    },
    {
      title: '库存',
      dataIndex: 'stock_quantity',
      search: false,
      width: 120,
      render: (_, record) =>
        `${record.stock_quantity} ${record.stock_unit_name || ''}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        statusOptions.map((item) => [item.value, item.label]),
      ),
      width: 110,
      render: (_, record) => (
        <Tag color={statusMeta[record.status]?.color}>
          {statusMeta[record.status]?.label || '未知'}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, record) => {
        const nextStatus = record.status === 1 ? 2 : 1;
        const actionText =
          record.status === 0
            ? '审核通过'
            : record.status === 1
              ? '下架'
              : '重新上架';
        return (
          <Space>
            <Button type="link" onClick={() => void openDetail(record)}>
              详情
            </Button>
            <Popconfirm
              title={`确认${actionText}该产品吗？`}
              okText="确认"
              cancelText="取消"
              onConfirm={() => void changeStatus(record, nextStatus)}
            >
              <Button type="link" danger={record.status === 1}>
                {actionText}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="产品审核"
      subTitle="审核供应方提交的产品，管理产品上下架状态"
    >
      <ProTable<AdminProduct>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const result = await listAdminProducts({
            keyword: params.keyword,
            category_id:
              params.category_id === undefined
                ? undefined
                : Number(params.category_id),
            status:
              params.status === undefined ? undefined : Number(params.status),
            page: params.current,
            page_size: params.pageSize,
          });
          return { data: result.items, total: result.total, success: true };
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        dateFormatter="string"
      />

      <Drawer
        title={detail ? `产品详情 · ${detail.name}` : '产品详情'}
        width={720}
        open={detailOpen}
        loading={detailLoading}
        onClose={closeDetail}
        extra={
          !detailLoading && detail ? (
            <Popconfirm
              title={
                detail.status === 1
                  ? '确认下架该产品吗？'
                  : detail.status === 0
                    ? '确认审核通过并上架该产品吗？'
                    : '确认重新上架该产品吗？'
              }
              okText="确认"
              cancelText="取消"
              onConfirm={() =>
                void changeStatus(detail, detail.status === 1 ? 2 : 1)
              }
            >
              <Button type="primary">
                {detail.status === 1
                  ? '下架'
                  : detail.status === 0
                    ? '审核通过'
                    : '重新上架'}
              </Button>
            </Popconfirm>
          ) : undefined
        }
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="产品名称">
                {detail.name}
              </Descriptions.Item>
              <Descriptions.Item label="产品 ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="供应企业">
                {detail.supplier_company || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="类目">
                {detail.category_name ||
                  categoryEnum[detail.category_id] ||
                  '未分类'}
              </Descriptions.Item>
              <Descriptions.Item label="库存">
                {detail.stock_quantity} {detail.stock_unit_name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMeta[detail.status]?.color}>
                  {statusMeta[detail.status]?.label || '未知'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {detail.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {detail.updated_at}
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 24 }}>产品图片（{detail.image_count}）</h3>
            {detail.images?.length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {detail.images.map((image) =>
                    image.url ? (
                      <Image
                        key={image.id}
                        width={96}
                        height={96}
                        src={image.url}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : null,
                  )}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无产品图片"
              />
            )}

            <h3 style={{ marginTop: 24 }}>产品参数</h3>
            {detail.attributes?.length ? (
              <Descriptions column={1} bordered size="small">
                {detail.attributes.map((attribute) => (
                  <Descriptions.Item
                    key={attribute.attribute_id}
                    label={attribute.name}
                  >
                    {formatAttribute(attribute) || '—'}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无动态参数"
              />
            )}
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Products;
