import { request } from '@umijs/max';
import type { ApiEnvelope } from './auth';

export type VipOrder = {
  id: number; order_no: string; user_id: number; user_company?: string; plan_name: string;
  plan_code_snapshot?: string; plan_name_snapshot?: string; plan_description_snapshot?: string;
  plan_type_snapshot?: string; billing_cycle_snapshot?: string;
  duration_days_snapshot?: number; original_price_fen_snapshot?: number; amount_fen: number;
  currency: string; status: string; payment_method: string; provider_transaction_id?: string;
  service_agreement_id?: number; service_agreement_version?: number; auto_renew_agreement_id?: number;
  auto_renew_agreement_version?: number; paid_at?: string; created_at: string;
  entitlement_start_at?: string; entitlement_end_at?: string; latest_refund_id?: number; refund_status?: RefundStatus;
};
export type RefundStatus = 'created' | 'processing' | 'success' | 'closed' | 'abnormal';
export type VipRefund = {
  id: number; refund_no: string; order_id: number; order_no: string; user_id: number;
  user_company?: string; plan_name?: string; requested_by_admin_id?: number; admin_name?: string;
  reason: string; amount_fen: number; total_fen: number; currency: string; status: RefundStatus;
  provider_refund_id?: string; payer_refund_fen?: number; received_account?: string;
  entitlement_status: 'pending' | 'reclaimed' | 'none' | 'manual'; reclaimed_seconds: number;
  last_error?: string; success_at?: string; created_at: string; updated_at: string;
};
type Page<T> = { items: T[]; total: number; page: number; page_size: number };
export type RefundFilter = { order_id?: number; order_no?: string; refund_no?: string; status?: string; page?: number; page_size?: number };

function ok<T>(response: ApiEnvelope<T>, fallback: string): T {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}
export async function listVipOrders(params: { order_no?: string; status?: string; page?: number; page_size?: number }) {
  return ok(await request<ApiEnvelope<Page<VipOrder>>>('/api/v1/admin/vip/orders', { method: 'GET', params }), '获取会员订单失败');
}
export async function createVipRefund(orderID: number, reason: string) {
  return ok(await request<ApiEnvelope<VipRefund>>(`/api/v1/admin/vip/orders/${orderID}/refund`, { method: 'POST', data: { reason } }), '提交退款失败');
}
export async function listVipRefunds(params: RefundFilter) {
  return ok(await request<ApiEnvelope<Page<VipRefund>>>('/api/v1/admin/vip/refunds', { method: 'GET', params }), '获取退款记录失败');
}
export async function syncVipRefund(id: number) {
  return ok(await request<ApiEnvelope<VipRefund>>(`/api/v1/admin/vip/refunds/${id}`, { method: 'GET' }), '查询微信退款结果失败');
}
export async function retryVipRefund(id: number) {
  return ok(await request<ApiEnvelope<VipRefund>>(`/api/v1/admin/vip/refunds/${id}/retry`, { method: 'POST' }), '重试退款失败');
}
