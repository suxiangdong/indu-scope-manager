import { Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import type { VipOrder, VipRefund } from '@/services/vipPayments';

export const orderStatuses: Record<string, { text: string; status: string }> = {
  pending: { text: '待支付', status: 'Default' },
  paying: { text: '支付中', status: 'Processing' },
  paid: { text: '已支付', status: 'Success' },
  closed: { text: '已关闭', status: 'Default' },
  failed: { text: '支付失败', status: 'Error' },
  refunded: { text: '已退款', status: 'Warning' },
};
export const refundStatuses = {
  created: { text: '待确认', status: 'Default' },
  processing: { text: '退款中', status: 'Processing' },
  success: { text: '退款成功', status: 'Success' },
  closed: { text: '退款关闭', status: 'Default' },
  abnormal: { text: '退款异常', status: 'Error' },
};
export const money = (fen: number) => `¥${(fen / 100).toFixed(2)}`;
export const dateTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
export function canRefund(order: VipOrder): boolean {
  return (
    order.status === 'paid' &&
    order.amount_fen > 0 &&
    order.payment_method === 'wechat_miniapp' &&
    Boolean(order.provider_transaction_id) &&
    order.plan_type_snapshot === 'normal' &&
    (!order.refund_status || order.refund_status === 'closed') &&
    Boolean(order.paid_at) &&
    dayjs().diff(dayjs(order.paid_at), 'second') <= 365 * 86400
  );
}
export function refundTag(status?: string) {
  const item = status
    ? refundStatuses[status as keyof typeof refundStatuses]
    : undefined;
  if (!item) return '—';
  const color =
    status === 'success'
      ? 'success'
      : status === 'abnormal'
        ? 'error'
        : status === 'processing'
          ? 'processing'
          : 'default';
  return <Tag color={color}>{item.text}</Tag>;
}
export function entitlementLabel(refund: VipRefund): string {
  if (refund.status === 'closed') return '未回收权益';
  if (refund.status !== 'success') return '退款成功后处理';
  if (refund.entitlement_status === 'manual') return '权益待人工核对';
  if (refund.entitlement_status === 'reclaimed')
    return `已回收 ${(refund.reclaimed_seconds / 86400).toFixed(2)} 天`;
  return refund.entitlement_status === 'none'
    ? '本单已无剩余时长'
    : '权益待核对';
}
