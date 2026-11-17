import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
  listVipAgreements,
  updateVipAgreement,
  type VipAgreement,
} from '@/services/vipAgreements';

vi.mock('@ant-design/pro-components', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ant-design/pro-components')>();
  return {
    ...actual,
    PageContainer: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/services/vipAgreements', () => ({
  listVipAgreements: vi.fn(),
  updateVipAgreement: vi.fn(),
}));

import VipAgreements from './index';

const serviceAgreement: VipAgreement = {
  id: 1,
  key: 'service',
  title: '会员服务条款',
  content: '服务协议独立正文',
  status: 1,
  version: 1,
  updated_at: '',
};
const renewalAgreement: VipAgreement = {
  id: 2,
  key: 'auto-renew',
  title: '自动续费条款',
  content: '自动续费独立正文',
  status: 1,
  version: 2,
  updated_at: '',
};

describe('VIP agreement tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listVipAgreements).mockResolvedValue({
      items: [serviceAgreement, renewalAgreement],
    });
    vi.mocked(updateVipAgreement).mockImplementation(async (key, values) => ({
      ...(key === 'service' ? serviceAgreement : renewalAgreement),
      ...values,
      version: key === 'service' ? 2 : 3,
    }));
  });

  it('keeps each agreement body and save target independent after tab changes and a version update', async () => {
    const screen = await render(
      <App>
        <VipAgreements />
      </App>,
    );
    const body = () => screen.getByRole('textbox', { name: /协议正文/ });
    await expect.element(body()).toHaveValue(serviceAgreement.content);

    await screen.getByRole('tab', { name: '自动续费协议' }).click();
    await expect.element(body()).toHaveValue(renewalAgreement.content);
    await screen.getByRole('tab', { name: '会员服务协议' }).click();
    await body().fill('更新后的服务协议正文');
    await screen.getByRole('button', { name: /保存协议/ }).click();
    await vi.waitFor(() => {
      expect(updateVipAgreement).toHaveBeenCalledWith('service', {
        title: serviceAgreement.title,
        content: '更新后的服务协议正文',
        status: 1,
      });
    });
    await expect
      .element(screen.getByRole('tabpanel').getByText(/当前版本：v2/))
      .toBeVisible();

    await screen.getByRole('tab', { name: '自动续费协议' }).click();
    await expect.element(body()).toHaveValue(renewalAgreement.content);
    await expect
      .element(screen.getByRole('textbox', { name: /协议标题/ }))
      .toHaveValue(renewalAgreement.title);
    await screen.getByRole('button', { name: /保存协议/ }).click();
    await vi.waitFor(() => {
      expect(updateVipAgreement).toHaveBeenLastCalledWith('auto-renew', {
        title: renewalAgreement.title,
        content: renewalAgreement.content,
        status: 1,
      });
    });
  });
});
