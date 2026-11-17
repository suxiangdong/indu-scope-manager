import { request } from '@umijs/max';
import type { ApiEnvelope } from './auth';

export type VipPlan = { id: number; code: string; name: string; description?: string; billing_cycle: string; plan_type: 'normal' | 'auto_renew'; duration_days: number; price_fen: number; original_price_fen: number; currency: string; auto_renew_enabled: boolean; status: number; sort_order: number; created_at: string; updated_at: string };
export type VipPlanForm = { code?: string; name: string; description?: string; billing_cycle: string; plan_type: 'normal' | 'auto_renew'; duration_days: number; price_fen: number; original_price_fen: number; auto_renew_enabled?: number; sort_order?: number };

function ok<T>(response: ApiEnvelope<T>, fallback: string) { if (response.code !== 0) throw new Error(response.message || fallback); return response.data; }
export async function listVipPlans(status?: number) { const response = await request<ApiEnvelope<{ items: VipPlan[] }>>('/api/v1/admin/vip/plans', { method: 'GET', params: status === undefined ? undefined : { status } }); return ok(response, '获取会员套餐失败'); }
export async function createVipPlan(data: VipPlanForm) { const response = await request<ApiEnvelope<VipPlan>>('/api/v1/admin/vip/plans/create', { method: 'POST', data }); return ok(response, '创建会员套餐失败'); }
export async function updateVipPlan(id: number, data: VipPlanForm) { const response = await request<ApiEnvelope<VipPlan>>('/api/v1/admin/vip/plans/update', { method: 'POST', data: { id, ...data } }); return ok(response, '更新会员套餐失败'); }
export async function updateVipPlanStatus(id: number, status: number) { const response = await request<ApiEnvelope<VipPlan>>('/api/v1/admin/vip/plans/status', { method: 'POST', data: { id, status } }); return ok(response, '更新会员套餐状态失败'); }
