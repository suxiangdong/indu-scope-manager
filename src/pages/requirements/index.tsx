import { EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AdminRequirement,
  type AdminRequirementAttribute,
  getAdminProcurementRequirementDetail,
  listAdminProcurementRequirements,
  type RequirementReviewStatus,
  type RequirementStatus,
  reviewAdminProcurementRequirement,
} from '@/services/adminProcurementRequirements';
import { type CategoryListItem, listCategories } from '@/services/categories';

const reviewStatusEnum = {
  0: '审核中',
  1: '已通过',
  2: '未通过',
};

const statusEnum = {
  0: '审核中',
  1: '招募中',
  2: '已下架',
  3: '已结束',
  4: '已过期',
  5: '审核驳回',
};

function reviewStatusTag(status: RequirementReviewStatus) {
  if (status === 0) return <Tag color="processing">审核中</Tag>;
  if (status === 2) return <Tag color="error">未通过</Tag>;
  return <Tag color="success">已通过</Tag>;
}

function categoryValueEnum(categories: CategoryListItem[]) {
  return categories.reduce<Record<number, string>>((result, category) => {
    result[category.id] = category.name;
    return result;
  }, {});
}

function formatAttribute(attribute: AdminRequirementAttribute) {
  return attribute.value || '—';
}

function formatDate(value?: string) {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

const RequirementReviewPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const detailRequestRef = useRef(0);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<AdminRequirement>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>(
    'approve',
  );
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

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

  const openDetail = async (record: AdminRequirement) => {
    const requestId = ++detailRequestRef.current;
    setDetail(undefined);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const result = await getAdminProcurementRequirementDetail(record.id);
      if (requestId === detailRequestRef.current) setDetail(result);
    } catch (error) {
      if (requestId !== detailRequestRef.current) return;
      message.error(
        error instanceof Error ? error.message : '获取需求详情失败',
      );
      setDrawerOpen(false);
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setDrawerOpen(false);
    setDetail(undefined);
    setDetailLoading(false);
    setReviewOpen(false);
    setReviewing(false);
  };

  const openReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewReason('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!detail || reviewing) return;
    const requestId = detailRequestRef.current;
    if (reviewAction === 'reject' && !reviewReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setReviewing(true);
    try {
      const result = await reviewAdminProcurementRequirement({
        id: detail.id,
        review_status: reviewAction === 'approve' ? 1 : 2,
        reason: reviewReason.trim(),
      });
      if (requestId === detailRequestRef.current) {
        setDetail((current) =>
          current?.id === result.id
            ? { ...result, responses: current.responses }
            : current,
        );
        setReviewOpen(false);
      }
      message.success(
        reviewAction === 'approve' ? '需求审核已通过' : '需求已驳回',
      );
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '提交审核结果失败',
      );
    } finally {
      if (requestId === detailRequestRef.current) setReviewing(false);
    }
  };

  const columns: ProColumns<AdminRequirement>[] = [
    {
      title: '需求名称',
      dataIndex: 'keyword',
      width: 200,
      render: (_, record) => (
        <Space
          direction="vertical"
          size={0}
          style={{ minWidth: 0, maxWidth: 170 }}
        >
          <Typography.Text strong ellipsis={{ tooltip: record.name }}>
            {record.name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '采购企业',
      dataIndex: 'buyer_company',
      search: false,
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.buyer_company || `用户 ${record.buyer_user_id}`,
    },
    {
      title: '类目',
      dataIndex: 'category_id',
      valueType: 'select',
      valueEnum: categoryEnum,
      width: 100,
      render: (_, record) =>
        record.category_name ||
        record.category_name_snapshot ||
        categoryEnum[record.category_id] ||
        '未分类',
    },
    {
      title: '需求数量',
      dataIndex: 'quantity',
      search: false,
      width: 90,
      render: (_, record) =>
        `${record.quantity} ${record.stock_unit_name || record.stock_unit_name_snapshot || ''}`,
    },
    {
      title: '审核状态',
      dataIndex: 'review_status',
      valueType: 'select',
      valueEnum: reviewStatusEnum,
      width: 90,
      render: (_, record) => reviewStatusTag(record.review_status),
    },
    {
      title: '需求状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      width: 90,
      render: (_, record) => statusEnum[record.status] || '未知',
    },
    { title: '响应数', dataIndex: 'response_count', search: false, width: 70 },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
      width: 145,
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => void openDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="需求审核"
      subTitle="查看采购方发布的需求，并处理需求审核结果"
    >
      <ProTable<AdminRequirement>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const result = await listAdminProcurementRequirements({
            keyword: params.keyword,
            category_id:
              params.category_id === undefined
                ? undefined
                : Number(params.category_id),
            review_status:
              params.review_status === undefined
                ? undefined
                : (Number(params.review_status) as RequirementReviewStatus),
            status:
              params.status === undefined
                ? undefined
                : (Number(params.status) as RequirementStatus),
            page: params.current,
            page_size: params.pageSize,
          });
          return { data: result.items, total: result.total, success: true };
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        dateFormatter="string"
      />

      <Drawer
        title={detail ? `需求详情 · ${detail.name}` : '需求详情'}
        width={760}
        open={drawerOpen}
        loading={detailLoading}
        onClose={closeDetail}
        extra={
          !detailLoading && detail?.review_status === 0 ? (
            <Space>
              <Button danger onClick={() => openReview('reject')}>
                驳回
              </Button>
              <Button type="primary" onClick={() => openReview('approve')}>
                通过
              </Button>
            </Space>
          ) : undefined
        }
      >
        {detail && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="需求名称">
                {detail.name}
              </Descriptions.Item>
              <Descriptions.Item label="需求 ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="采购企业">
                {detail.buyer_company || `用户 ${detail.buyer_user_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="采购用户 ID">
                {detail.buyer_user_id}
              </Descriptions.Item>
              <Descriptions.Item label="类目">
                {detail.category_name ||
                  detail.category_name_snapshot ||
                  '未分类'}
              </Descriptions.Item>
              <Descriptions.Item label="需求数量">
                {detail.quantity}{' '}
                {detail.stock_unit_name || detail.stock_unit_name_snapshot}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                {reviewStatusTag(detail.review_status)}
              </Descriptions.Item>
              <Descriptions.Item label="需求状态">
                {statusEnum[detail.status] || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="交付地址" span={2}>
                {detail.delivery_address || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="期望交付时间">
                {formatDate(detail.expected_delivery_date)}
              </Descriptions.Item>
              <Descriptions.Item label="响应数量">
                {detail.response_count}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">
                {detail.contact_name} / {detail.contact_phone}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {formatDate(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {formatDate(detail.published_at)}
              </Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {formatDate(detail.expires_at)}
              </Descriptions.Item>
              {detail.review_reason && (
                <Descriptions.Item label="驳回原因" span={2}>
                  {detail.review_reason}
                </Descriptions.Item>
              )}
              {detail.description && (
                <Descriptions.Item label="需求说明" span={2}>
                  {detail.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <section>
              <Typography.Title level={5}>需求参数</Typography.Title>
              {detail.attributes?.length ? (
                <Descriptions column={1} bordered size="small">
                  {detail.attributes.map((attribute) => (
                    <Descriptions.Item
                      key={attribute.attribute_id}
                      label={
                        attribute.attribute_name ||
                        `属性 ${attribute.attribute_id}`
                      }
                    >
                      {formatAttribute(attribute)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无动态参数"
                />
              )}
            </section>

            <section>
              <Typography.Title level={5}>附件</Typography.Title>
              {detail.files?.length ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {detail.files.map((file) => (
                    <Space key={file.id}>
                      {file.url && file.content_type.startsWith('image/') ? (
                        <Image
                          width={64}
                          height={64}
                          src={file.url}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                      ) : null}
                      <Typography.Text copyable={Boolean(file.path)}>
                        {file.original_name || file.path}
                      </Typography.Text>
                    </Space>
                  ))}
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无附件"
                />
              )}
            </section>

            <section>
              <Typography.Title level={5}>
                供货响应（{detail.responses?.length || 0}）
              </Typography.Title>
              {detail.responses?.length ? (
                <List
                  bordered
                  dataSource={detail.responses}
                  renderItem={(response) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${response.supplier_company || `用户 ${response.supplier_user_id}`} · ${formatDate(response.created_at)}`}
                        description={response.message || '未填写响应说明'}
                      />
                      <Typography.Text type="secondary">
                        {response.available_quantity === undefined
                          ? ''
                          : `可供 ${response.available_quantity}`}
                        {response.lead_time_days === undefined
                          ? ''
                          : `，交期 ${response.lead_time_days} 天`}
                      </Typography.Text>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无供货响应"
                />
              )}
            </section>
          </Space>
        )}
      </Drawer>

      <Modal
        title={reviewAction === 'approve' ? '通过需求审核' : '驳回需求审核'}
        open={reviewOpen}
        confirmLoading={reviewing}
        okText="确认"
        cancelText="取消"
        onOk={() => void submitReview()}
        onCancel={() => setReviewOpen(false)}
      >
        {reviewAction === 'approve' ? (
          <Typography.Paragraph>
            确认需求内容合规并通过审核吗？通过后需求会进入招募状态。
          </Typography.Paragraph>
        ) : (
          <Input.TextArea
            rows={5}
            maxLength={500}
            showCount
            value={reviewReason}
            placeholder="请输入驳回原因，采购方可以根据原因重新提交。"
            onChange={(event) => setReviewReason(event.target.value)}
          />
        )}
      </Modal>
    </PageContainer>
  );
};

export default RequirementReviewPage;
