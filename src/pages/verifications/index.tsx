import { EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Image,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

import {
  getVerificationDetail,
  listVerifications,
  reviewVerification,
  type ReviewStatus,
  type VerificationDetail,
  type VerificationListItem,
  type VerificationType,
} from '@/services/verifications';

const statusEnum = {
  0: { text: '待审核', status: 'Processing' },
  1: { text: '已通过', status: 'Success' },
  2: { text: '已驳回', status: 'Error' },
};

const typeEnum = {
  personal: { text: '个人认证' },
  company: { text: '企业认证' },
};

function statusTag(status: ReviewStatus) {
  const item = statusEnum[status];
  return <Tag color={status === 0 ? 'processing' : status === 1 ? 'success' : 'error'}>{item.text}</Tag>;
}

const VerificationPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<VerificationDetail>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const openDetail = async (record: VerificationListItem) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      setDetail(await getVerificationDetail(record.type, record.id));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取认证详情失败');
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewReason('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!detail) return;
    if (reviewAction === 'reject' && !reviewReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setReviewing(true);
    try {
      const result = await reviewVerification({
        type: detail.type,
        id: detail.id,
        action: reviewAction,
        reason: reviewReason.trim(),
      });
      setDetail(result);
      setReviewOpen(false);
      message.success(reviewAction === 'approve' ? '认证已通过' : '认证已驳回');
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交审核结果失败');
    } finally {
      setReviewing(false);
    }
  };

  const columns: ProColumns<VerificationListItem>[] = [
    {
      title: '认证类型',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: typeEnum,
      render: (_, record) => record.type === 'company' ? '企业认证' : '个人认证',
    },
    {
      title: '申请主体',
      dataIndex: 'display_name',
      ellipsis: true,
    },
    {
      title: '用户手机号',
      dataIndex: 'phone',
    },
    {
      title: '审核状态',
      dataIndex: 'review_status',
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => statusTag(record.review_status),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '驳回原因',
      dataIndex: 'review_reason',
      search: false,
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title="认证审核" subTitle="查看用户提交的个人及企业认证资料，并处理审核结果">
      <ProTable<VerificationListItem>
        actionRef={actionRef}
        rowKey={(record) => `${record.type}-${record.id}`}
        columns={columns}
        request={async (params) => {
          const result = await listVerifications({
            type: params.type as VerificationType | undefined,
            review_status: params.review_status === undefined ? undefined : Number(params.review_status) as ReviewStatus,
          });
          return { data: result.items, success: true };
        }}
        pagination={false}
        dateFormatter="string"
      />

      <Drawer
        title={detail ? `${detail.type === 'company' ? '企业' : '个人'}认证详情` : '认证详情'}
        width={720}
        open={drawerOpen}
        loading={detailLoading}
        onClose={() => setDrawerOpen(false)}
        extra={detail?.review_status === 0 ? (
          <Space>
            <Button danger onClick={() => openReview('reject')}>驳回</Button>
            <Button type="primary" onClick={() => openReview('approve')}>通过</Button>
          </Space>
        ) : undefined}
      >
        {detail && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="审核状态">{statusTag(detail.review_status)}</Descriptions.Item>
              <Descriptions.Item label="用户手机号">{detail.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="申请主体">{detail.display_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="用户 ID">{detail.user_id}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{detail.created_at}</Descriptions.Item>
              <Descriptions.Item label="审核时间">{detail.reviewed_at || '—'}</Descriptions.Item>
              {detail.review_reason && <Descriptions.Item label="驳回原因" span={2}>{detail.review_reason}</Descriptions.Item>}
            </Descriptions>

            {detail.personal && (
              <Descriptions title="个人资料" column={1} bordered size="small">
                <Descriptions.Item label="真实姓名">{detail.personal.real_name}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{detail.personal.id_number_masked || '已提交'}</Descriptions.Item>
                <Descriptions.Item label="店铺平台">{detail.personal.store_platform_name || '—'}</Descriptions.Item>
                <Descriptions.Item label="店铺地址" span={2}>{detail.personal.store_url || '—'}</Descriptions.Item>
                <Descriptions.Item label="身份证正面对象">{detail.personal.id_front_path || '未上传'}</Descriptions.Item>
                <Descriptions.Item label="身份证反面对象">{detail.personal.id_back_path || '未上传'}</Descriptions.Item>
              </Descriptions>
            )}

            {detail.company && (
              <Descriptions title="企业资料" column={2} bordered size="small">
                <Descriptions.Item label="企业名称">{detail.company.company_name}</Descriptions.Item>
                <Descriptions.Item label="统一社会信用代码">{detail.company.unified_social_credit_code}</Descriptions.Item>
                <Descriptions.Item label="注册地址" span={2}>{detail.company.registered_address}</Descriptions.Item>
                <Descriptions.Item label="企业介绍" span={2}>{detail.company.introduction || '—'}</Descriptions.Item>
                <Descriptions.Item label="办公地址" span={2}>{detail.company.offices?.join('、') || '—'}</Descriptions.Item>
                <Descriptions.Item label="工厂地址" span={2}>{detail.company.factories?.join('、') || '—'}</Descriptions.Item>
                <Descriptions.Item label="营业执照对象" span={2}>
                  <Typography.Text copyable>{detail.company.business_license_path || '未上传'}</Typography.Text>
                </Descriptions.Item>
                {detail.company.business_license_url && (
                  <Descriptions.Item label="营业执照预览" span={2}>
                    <Image width={240} src={detail.company.business_license_url} alt="营业执照" />
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {detail.company?.contacts?.length ? (
              <List
                header="企业联系人"
                bordered
                dataSource={detail.company.contacts}
                renderItem={(contact) => (
                  <List.Item>
                    <Space><Typography.Text strong>{contact.name}</Typography.Text><span>{contact.position || '—'}</span><span>{contact.phone}</span></Space>
                  </List.Item>
                )}
              />
            ) : null}
          </Space>
        )}
      </Drawer>

      <Modal
        title={reviewAction === 'approve' ? '通过认证' : '驳回认证'}
        open={reviewOpen}
        confirmLoading={reviewing}
        okText="确认"
        cancelText="取消"
        onOk={submitReview}
        onCancel={() => setReviewOpen(false)}
      >
        {reviewAction === 'approve' ? (
          <Typography.Paragraph>确认资料无误并通过该认证吗？通过后用户将获得已认证状态。</Typography.Paragraph>
        ) : (
          <Input.TextArea
            rows={5}
            maxLength={500}
            showCount
            value={reviewReason}
            placeholder="请输入驳回原因，用户将可以根据原因修改后重新提交。"
            onChange={(event) => setReviewReason(event.target.value)}
          />
        )}
      </Modal>
    </PageContainer>
  );
};

export default VerificationPage;
