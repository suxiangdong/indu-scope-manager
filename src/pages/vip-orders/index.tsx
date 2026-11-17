import { EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createVipRefund,
  listVipOrders,
  type VipOrder,
} from '@/services/vipPayments';
import {
  canRefund,
  dateTime,
  money,
  orderStatuses,
  refundTag,
} from './paymentDisplay';

const VipOrders: React.FC = () => {
  const { message } = App.useApp();
  const access = useAccess();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const refundSubmitting = useRef(false);
  const [detail, setDetail] = useState<VipOrder>();
  const [refunding, setRefunding] = useState<VipOrder>();

  const columns: ProColumns<VipOrder>[] = [
    { title: '商户订单号', dataIndex: 'order_no', copyable: true, width: 250 },
    {
      title: '用户',
      dataIndex: 'user_company',
      search: false,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{r.user_company || '未设置名称'}</Typography.Text>
          <Typography.Text type="secondary">
            用户 ID：{r.user_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '购买套餐',
      dataIndex: 'plan_name',
      search: false,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>
            {r.plan_name_snapshot || r.plan_name}
          </Typography.Text>
          <Typography.Text type="secondary">
            {r.duration_days_snapshot || '—'} 天 ·{' '}
            {r.plan_type_snapshot === 'auto_renew' ? '自动续费' : '普通套餐'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'amount_fen',
      search: false,
      render: (_, r) => (
        <Typography.Text strong>{money(r.amount_fen)}</Typography.Text>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: orderStatuses,
      width: 110,
    },
    {
      title: '退款状态',
      dataIndex: 'refund_status',
      search: false,
      render: (_, r) => refundTag(r.refund_status),
      width: 110,
    },
    {
      title: '付款时间',
      dataIndex: 'paid_at',
      search: false,
      render: (_, r) => dateTime(r.paid_at),
      width: 170,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 230,
      fixed: 'right',
      render: (_, r) => (
        <Space size={0}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setDetail(r)}
          >
            详情
          </Button>
          {access.canRefund && canRefund(r) && (
            <Button
              danger
              type="link"
              icon={<RollbackOutlined />}
              onClick={() => setRefunding(r)}
            >
              整单退款
            </Button>
          )}
          {r.latest_refund_id && (
            <Button
              type="link"
              onClick={() =>
                history.push(
                  `/operations/vip-refunds?order_no=${encodeURIComponent(r.order_no)}`,
                )
              }
            >
              退款记录
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="会员订单"
      subTitle="查看付款与套餐快照，处理微信支付整单退款"
    >
      <ProTable<VipOrder>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1250 }}
        pagination={{ defaultPageSize: 20 }}
        request={async (params) => {
          const result = await listVipOrders({
            order_no: params.order_no?.trim(),
            status: params.status,
            page: params.current,
            page_size: params.pageSize,
          });
          return { data: result.items, total: result.total, success: true };
        }}
      />
      <Drawer
        title="会员订单详情"
        width={720}
        open={Boolean(detail)}
        onClose={() => setDetail(undefined)}
      >
        {detail && (
          <Descriptions
            column={2}
            bordered
            items={[
              {
                key: 'no',
                label: '订单号',
                children: (
                  <Typography.Text copyable>{detail.order_no}</Typography.Text>
                ),
                span: 2,
              },
              {
                key: 'user',
                label: '购买用户',
                children: `${detail.user_company || '用户'}（ID ${detail.user_id}）`,
                span: 2,
              },
              {
                key: 'plan',
                label: '下单套餐',
                children: detail.plan_name_snapshot || detail.plan_name,
              },
              {
                key: 'code',
                label: '套餐编码',
                children: detail.plan_code_snapshot || '—',
              },
              {
                key: 'price',
                label: '订单金额',
                children: money(detail.amount_fen),
              },
              {
                key: 'original',
                label: '下单时原价',
                children: money(detail.original_price_fen_snapshot || 0),
              },
              {
                key: 'days',
                label: '权益时长',
                children: `${detail.duration_days_snapshot || '—'} 天`,
              },
              {
                key: 'status',
                label: '订单状态',
                children: (
                  <Tag>
                    {orderStatuses[detail.status]?.text || detail.status}
                  </Tag>
                ),
              },
              {
                key: 'refund',
                label: '退款状态',
                children: refundTag(detail.refund_status),
              },
              {
                key: 'transaction',
                label: '微信交易号',
                children: detail.provider_transaction_id ? (
                  <Typography.Text copyable>
                    {detail.provider_transaction_id}
                  </Typography.Text>
                ) : (
                  '—'
                ),
                span: 2,
              },
              {
                key: 'start',
                label: '本单权益开始',
                children: dateTime(detail.entitlement_start_at),
              },
              {
                key: 'end',
                label: '本单权益结束',
                children: dateTime(detail.entitlement_end_at),
              },
              {
                key: 'service',
                label: '会员服务协议',
                children: detail.service_agreement_id
                  ? `#${detail.service_agreement_id} / v${detail.service_agreement_version}`
                  : '—',
              },
              {
                key: 'renew',
                label: '自动续费协议',
                children: detail.auto_renew_agreement_id
                  ? `#${detail.auto_renew_agreement_id} / v${detail.auto_renew_agreement_version}`
                  : '不适用',
              },
              {
                key: 'created',
                label: '创建时间',
                children: dateTime(detail.created_at),
              },
              {
                key: 'paid',
                label: '付款时间',
                children: dateTime(detail.paid_at),
              },
            ]}
          />
        )}
      </Drawer>
      {access.canRefund && (
        <ModalForm<{ reason: string }>
          key={refunding?.id || 'closed'}
          title="确认整单退款"
          open={Boolean(refunding)}
          width={560}
          modalProps={{ destroyOnHidden: true, maskClosable: false }}
          onOpenChange={(open) => {
            if (!open && !refundSubmitting.current) setRefunding(undefined);
          }}
          submitter={{
            searchConfig: { submitText: '确认原路退款' },
            submitButtonProps: { danger: true },
          }}
          onFinish={async ({ reason }) => {
            if (!access.canRefund || !refunding || refundSubmitting.current)
              return false;
            refundSubmitting.current = true;
            try {
              const result = await createVipRefund(refunding.id, reason.trim());
              if (result.status === 'success') message.success('退款成功');
              else if (result.status === 'created')
                message.warning(
                  result.last_error ||
                    '退款结果尚未确认，请在退款记录中查询或重试',
                );
              else if (result.status === 'processing')
                message.info('微信已受理退款，请在退款记录中查看最终结果');
              else message.warning('请在退款记录中查看处理结果');
              setRefunding(undefined);
              setDetail(undefined);
              actionRef.current?.reload();
              return true;
            } catch (error) {
              message.error(
                error instanceof Error ? error.message : '退款操作失败',
              );
              return false;
            } finally {
              refundSubmitting.current = false;
            }
          }}
        >
          {refunding && (
            <>
              <Descriptions
                column={1}
                style={{ marginBottom: 20 }}
                items={[
                  {
                    key: 'order',
                    label: '订单号',
                    children: refunding.order_no,
                  },
                  {
                    key: 'user',
                    label: '购买用户',
                    children:
                      refunding.user_company || `用户 ${refunding.user_id}`,
                  },
                  {
                    key: 'plan',
                    label: '购买套餐',
                    children:
                      refunding.plan_name_snapshot || refunding.plan_name,
                  },
                  {
                    key: 'amount',
                    label: '整单退款金额',
                    children: (
                      <Typography.Text
                        strong
                        type="danger"
                        style={{ fontSize: 24 }}
                      >
                        {money(refunding.amount_fen)}
                      </Typography.Text>
                    ),
                  },
                ]}
              />
              <Alert
                type={
                  refunding.entitlement_start_at && refunding.entitlement_end_at
                    ? 'info'
                    : 'warning'
                }
                showIcon
                style={{ marginBottom: 20 }}
                message={
                  refunding.entitlement_start_at && refunding.entitlement_end_at
                    ? '退款成功后回收本单尚未使用的会员时长，其他订单购买的权益保持有效。'
                    : '该历史订单缺少完整权益记录。退款成功后将标记为“权益待人工核对”，不会自动缩短其他订单权益。'
                }
              />
            </>
          )}
          <ProFormTextArea
            name="reason"
            label="退款原因"
            placeholder="原因会展示在用户的微信退款通知中"
            fieldProps={{
              maxLength: 80,
              showCount: {
                formatter: ({ value }) =>
                  `${new TextEncoder().encode(value || '').length} / 80 字节`,
              },
            }}
            rules={[
              { required: true, whitespace: true, message: '请填写退款原因' },
              {
                validator: async (_: unknown, value: string) => {
                  if (
                    new TextEncoder().encode((value || '').trim()).length > 80
                  )
                    throw new Error('退款原因不能超过80字节，中文通常最多26字');
                },
              },
            ]}
          />
        </ModalForm>
      )}
    </PageContainer>
  );
};
export default VipOrders;
