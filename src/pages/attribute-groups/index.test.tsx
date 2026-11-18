import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
  type CategoryAttributeBinding,
  listAttributeGroups,
  listCategoryAttributeBindings,
  listGroupCategories,
  saveCategoryAttributeBinding,
} from '@/services/attributes';
import { listCategories } from '@/services/categories';

vi.mock('@ant-design/pro-components', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ant-design/pro-components')>();
  return {
    ...actual,
    PageContainer: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/services/attributes', () => ({
  bindCategoryGroup: vi.fn(),
  createAttributeGroup: vi.fn(),
  deleteAttributeGroup: vi.fn(),
  deleteGroupAttribute: vi.fn(),
  listAttributeGroups: vi.fn(),
  listAttributes: vi.fn(async () => ({ items: [] })),
  listCategoryAttributeBindings: vi.fn(),
  listGroupAttributes: vi.fn(),
  listGroupCategories: vi.fn(),
  saveCategoryAttributeBinding: vi.fn(),
  saveGroupAttribute: vi.fn(),
  unbindCategoryGroup: vi.fn(),
  updateAttributeGroup: vi.fn(),
}));
vi.mock('@/services/categories', () => ({ listCategories: vi.fn() }));

import AttributeGroups from './index';

const group = {
  id: 1,
  code: 'motor',
  name: '电机参数',
  display_name: '基本参数',
  sort_order: 0,
  status: 1,
  attribute_count: 2,
  category_count: 1,
  created_at: '',
  updated_at: '',
};
const initialBindings: CategoryAttributeBinding[] = [
  {
    category_id: 10,
    category_name: '电机',
    attribute_id: 1,
    attribute_code: 'power',
    attribute_name: '功率',
    group_id: group.id,
    group_name: group.name,
    group_display_name: group.display_name,
    is_required: 1,
    is_filterable: 1,
    is_searchable: 1,
    sort_order: 10,
    created_at: '',
    updated_at: '',
  },
  {
    category_id: 10,
    category_name: '电机',
    attribute_id: 2,
    attribute_code: 'voltage',
    attribute_name: '电压',
    group_id: group.id,
    group_name: group.name,
    group_display_name: group.display_name,
    is_required: 0,
    is_filterable: 1,
    is_searchable: 0,
    sort_order: 20,
    created_at: '',
    updated_at: '',
  },
];

describe('category attribute configuration', () => {
  let persisted: CategoryAttributeBinding[];

  beforeEach(() => {
    vi.clearAllMocks();
    persisted = initialBindings.map((item) => ({ ...item }));
    vi.mocked(listAttributeGroups).mockResolvedValue({ items: [group] });
    vi.mocked(listCategories).mockResolvedValue({
      items: [{ id: 10, parent_id: 0, name: '电机', sort_order: 0, status: 1, created_at: '', updated_at: '' }],
    });
    vi.mocked(listGroupCategories).mockResolvedValue({
      items: [{
        category_id: 10,
        category_name: '电机',
        group_id: group.id,
        group_code: group.code,
        group_name: group.name,
        group_display_name: group.display_name,
        sort_order: 0,
        status: 1,
        attribute_count: 2,
        created_at: '',
        updated_at: '',
      }],
    });
    vi.mocked(listCategoryAttributeBindings).mockImplementation(async () => ({
      items: persisted.map((item) => ({ ...item })),
    }));
    vi.mocked(saveCategoryAttributeBinding).mockImplementation(async (values) => {
      const index = persisted.findIndex((item) => item.attribute_id === values.attribute_id);
      const saved = { ...persisted[index], ...values } as CategoryAttributeBinding;
      persisted[index] = saved;
      persisted.sort((left, right) => left.sort_order - right.sort_order);
      return saved;
    });
  });

  async function openConfiguration() {
    const screen = await render(<App><AttributeGroups /></App>);
    await screen.getByRole('button', { name: '绑定类目', exact: true }).click();
    await screen.getByRole('button', { name: '配置属性', exact: true }).click();
    await expect.element(screen.getByRole('spinbutton', { name: '电压排序' })).toHaveAttribute('value', '20');
    return screen;
  }

  it('persists the category-specific order without losing flags and keeps it after reopening', async () => {
    const screen = await openConfiguration();
    await screen.getByRole('spinbutton', { name: '电压排序' }).fill('5');
    await screen.getByRole('button', { name: '保存电压配置' }).click();
    await vi.waitFor(() => {
      expect(saveCategoryAttributeBinding).toHaveBeenCalledWith({
        category_id: 10,
        attribute_id: 2,
        group_id: group.id,
        group_name: group.name,
        is_required: 0,
        is_filterable: 1,
        is_searchable: 0,
        sort_order: 5,
      });
    });
    await expect.element(screen.getByRole('button', { name: '保存电压配置' })).toBeDisabled();
    const rows = () => {
      const input = document.querySelector('[aria-label="电压排序"]');
      return [...(input?.closest('[role="dialog"]')?.querySelectorAll('tr[data-row-key]') ?? [])];
    };
    await vi.waitFor(() => {
      expect(rows()[0]?.textContent).toContain('电压');
      expect(rows()[1]?.textContent).toContain('功率');
    });
    await screen.getByRole('button', { name: 'Close', exact: true }).nth(1).click();
    await screen.getByRole('button', { name: '配置属性', exact: true }).click();
    await expect.element(screen.getByRole('spinbutton', { name: '电压排序' })).toHaveAttribute('value', '5');
    expect(listCategoryAttributeBindings).toHaveBeenLastCalledWith(10);
  });

  it('retains an unsaved value on request failure so it can be retried', async () => {
    vi.mocked(saveCategoryAttributeBinding).mockRejectedValueOnce(new Error('保存失败，请重试'));
    const screen = await openConfiguration();
    await screen.getByRole('spinbutton', { name: '电压排序' }).fill('0');
    await screen.getByRole('button', { name: '保存电压配置' }).click();
    await expect.element(screen.getByRole('button', { name: '保存电压配置' })).toBeEnabled();
    await expect.element(screen.getByRole('spinbutton', { name: '电压排序' })).toHaveAttribute('value', '0');
    expect(persisted[0].attribute_id).toBe(1);
    await screen.getByRole('button', { name: '保存电压配置' }).click();
    await vi.waitFor(() => {
      expect(saveCategoryAttributeBinding).toHaveBeenCalledTimes(2);
      expect(persisted[0].attribute_id).toBe(2);
      expect(persisted[0].sort_order).toBe(0);
    });
    await expect.element(screen.getByRole('button', { name: '保存电压配置' })).toBeDisabled();
  });
});
