import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type AppPageKey = 'about-us' | 'contact';

export type AppPageContent = {
  page_key: AppPageKey;
  title: string;
  summary: string;
  body: string;
  contact_phone: string;
  contact_email: string;
  service_hours: string;
  address: string;
  wechat_account: string;
  status: number;
  updated_at?: string;
};

export type AppPageFormValues = Omit<AppPageContent, 'page_key' | 'updated_at'>;

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listAppPages() {
  const response = await request<ApiEnvelope<{ items: AppPageContent[] }>>(
    '/api/v1/admin/app-pages',
    { method: 'GET' },
  );
  const data = await ensureSuccess(response, '获取小程序页面内容失败');
  return data.items || [];
}

export async function updateAppPage(pageKey: AppPageKey, data: AppPageFormValues) {
  const response = await request<ApiEnvelope<AppPageContent>>(
    '/api/v1/admin/app-pages/update',
    { method: 'POST', data: { page_key: pageKey, ...data } },
  );
  return ensureSuccess(response, '保存小程序页面内容失败');
}
