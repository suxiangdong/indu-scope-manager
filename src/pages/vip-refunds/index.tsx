import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useAccess, useLocation } from '@umijs/max';
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
  listVipRefunds,
  retryVipRefund,
  syncVipRefund,
  type VipRefund,
} from '@/services/vipPayments';
import {
  dateTime,
  entitlementLabel,
  money,
  refundStatuses,
  refundTag,
} from '../vip-orders/paymentDisplay';

const VipRefunds: React.FC = () => {
  const { message, modal } = App.useApp();
  const access = useAccess();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const busyRef = useRef(false);
  const [busyID, setBusyID] = useState<number>();
  const [detail, setDetail] = useState<VipRefund>();
  const location = useLocation();
  const orderNo =
    new URLSearchParams(location.search).get('order_no') || undefined;

  const updateRefund = async (record: VipRefund, retry = false) => {
    if (retry && !access.canRefund) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyID(record.id);
    try {
      const result = retry
        ? await retryVipRefund(record.id)
        : await syncVipRefund(record.id);
      if (detail?.id === result.id) setDetail(result);
      if (result.last_error) message.warning(result.last_error);
      else message.success(`状态已更新：${refundStatuses[result.status].text}`);
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '退款状态更新失败',
      );
    } finally {
      busyRef.current = false;
      setBusyID(undefined);
    }
  };

  const retry = (record: VipRefund) => {
    if (!access.canRefund) return;
    modal.confirm({
      title: '重试原退款申请',
      content: `将使用同一退款单号 ${record.refund_no} 重试 ${money(record.amount_fen)} 的退款，不会新建另一笔退款。`,
      okText: '确认重试',
      cancelText: '取消',
      onOk: () => updateRefund(record, true),
    });
  };

  const columns: ProColumns<VipRefund>[] = [
    {
      title: '商户退款单号',
      dataIndex: 'refund_no',
      copyable: true,
      width: 300,
    },
    {
      title: '商户订单号',
      dataIndex: 'order_no',
      initialValue: orderNo,
      copyable: true,
      width: 250,
    },
    {
      title: '用户 / 套餐',
      dataIndex: 'user_company',
      search: false,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>
            {r.user_company || `用户 ${r.user_id}`}
          </Typography.Text>
          <Typography.Text type="secondary">
            {r.plan_name || '会员套餐'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '退款金额',
      dataIndex: 'amount_fen',
      search: false,
      render: (_, r) => money(r.amount_fen),
      width: 110,
    },
    {
      title: '退款状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: refundStatuses,
      render: (_, r) => refundTag(r.status),
      width: 115,
    },
    {
      title: '会员权益',
      dataIndex: 'entitlement_status',
      search: false,
      render: (_, r) => (
        <Tag
          color={
            r.entitlement_status === 'manual'
              ? 'warning'
              : r.status === 'success'
                ? 'success'
                : 'default'
          }
        >
          {entitlementLabel(r)}
        </Tag>
      ),
      width: 180,
    },
    {
      title: '申请管理员',
      dataIndex: 'admin_name',
      search: false,
      render: (_, r) =>
        r.admin_name ||
        (r.requested_by_admin_id ? `管理员 ${r.requested_by_admin_id}` : '—'),
      width: 130,
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      search: false,
      render: (_, r) => dateTime(r.created_at),
      width: 170,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 255,
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
          {r.status !== 'success' && r.status !== 'closed' && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              loading={busyID === r.id}
              disabled={Boolean(busyID && busyID !== r.id)}
              onClick={() => updateRefund(r)}
            >
              刷新状态
            </Button>
          )}
          {access.canRefund && r.status === 'created' && (
            <Button
              type="link"
              disabled={Boolean(busyID)}
              onClick={() => retry(r)}
            >
              重试申请
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="退款管理"
      subTitle="跟踪微信退款结果，查看会员时长回收记录"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="退款中表示微信已受理；只有退款成功才会更新订单和会员权益。异常退款需在微信商户平台处理，再刷新状态。"
      />
      <ProTable<VipRefund>
        key={orderNo || 'all'}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1650 }}
        pagination={{ defaultPageSize: 20 }}
        request={async (params) => {
          const result = await listVipRefunds({
            order_no: params.order_no?.trim(),
            refund_no: params.refund_no?.trim(),
            status: params.status,
            page: params.current,
            page_size: params.pageSize,
          });
          return { data: result.items, total: result.total, success: true };
        }}
      />
      <Drawer
        title="退款详情"
        width={720}
        open={Boolean(detail)}
        onClose={() => setDetail(undefined)}
        extra={
          detail &&
          detail.status !== 'success' &&
          detail.status !== 'closed' ? (
            <Button
              icon={<ReloadOutlined />}
              loading={busyID === detail.id}
              onClick={() => updateRefund(detail)}
            >
              刷新微信状态
            </Button>
          ) : undefined
        }
      >
        {detail && (
          <>
            {detail.last_error && (
              <Alert
                type="warning"
                showIcon
                message={detail.last_error}
                style={{ marginBottom: 20 }}
              />
            )}
            {detail.entitlement_status === 'manual' && (
              <Alert
                type="warning"
                showIcon
                message="资金已退款。历史权益记录不完整或曾被人工修改，请核对用户当前会员有效期后人工处理权益。"
                style={{ marginBottom: 20 }}
              />
            )}
            <Descriptions
              bordered
              column={2}
              items={[
                {
                  key: 'no',
                  label: '商户退款单号',
                  children: (
                    <Typography.Text copyable>
                      {detail.refund_no}
                    </Typography.Text>
                  ),
                  span: 2,
                },
                {
                  key: 'wx',
                  label: '微信退款单号',
                  children: detail.provider_refund_id ? (
                    <Typography.Text copyable>
                      {detail.provider_refund_id}
                    </Typography.Text>
                  ) : (
                    '待微信受理'
                  ),
                  span: 2,
                },
                {
                  key: 'order',
                  label: '商户订单号',
                  children: (
                    <Typography.Text copyable>
                      {detail.order_no}
                    </Typography.Text>
                  ),
                  span: 2,
                },
                {
                  key: 'user',
                  label: '购买用户',
                  children: detail.user_company || `用户 ${detail.user_id}`,
                },
                {
                  key: 'plan',
                  label: '购买套餐',
                  children: detail.plan_name || '—',
                },
                {
                  key: 'total',
                  label: '原订单金额',
                  children: money(detail.total_fen),
                },
                {
                  key: 'amount',
                  label: '申请退款金额',
                  children: (
                    <Typography.Text strong>
                      {money(detail.amount_fen)}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'paid',
                  label: '用户现金退款',
                  children:
                    detail.payer_refund_fen === undefined
                      ? '待微信确认'
                      : money(detail.payer_refund_fen),
                },
                {
                  key: 'account',
                  label: '到账账户',
                  children: detail.received_account || '—',
                },
                {
                  key: 'status',
                  label: '退款状态',
                  children: refundTag(detail.status),
                },
                {
                  key: 'rights',
                  label: '会员权益',
                  children: entitlementLabel(detail),
                },
                {
                  key: 'reason',
                  label: '退款原因',
                  children: detail.reason,
                  span: 2,
                },
                {
                  key: 'admin',
                  label: '申请管理员',
                  children:
                    detail.admin_name ||
                    (detail.requested_by_admin_id
                      ? `管理员 ${detail.requested_by_admin_id}`
                      : '—'),
                },
                {
                  key: 'created',
                  label: '申请时间',
                  children: dateTime(detail.created_at),
                },
                {
                  key: 'success',
                  label: '成功时间',
                  children: dateTime(detail.success_at),
                },
                {
                  key: 'updated',
                  label: '更新时间',
                  children: dateTime(detail.updated_at),
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};
export default VipRefunds;
