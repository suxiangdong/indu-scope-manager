import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type VipAgreement = {
  id: number;
  key: 'service' | 'auto-renew' | 'user' | 'privacy';
  title: string;
  content: string;
  status: number;
  version: number;
  updated_at: string;
};

export type VipAgreementForm = Pick<VipAgreement, 'title' | 'content' | 'status'>;

function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listVipAgreements() {
  const response = await request<ApiEnvelope<{ items: VipAgreement[] }>>('/api/v1/admin/vip/agreements', { method: 'GET' });
  return ensureSuccess(response, '获取协议失败');
}

export async function updateVipAgreement(key: VipAgreement['key'], data: VipAgreementForm) {
  const response = await request<ApiEnvelope<VipAgreement>>('/api/v1/admin/vip/agreements/update', { method: 'POST', data: { key, ...data } });
  return ensureSuccess(response, '保存协议失败');
}
