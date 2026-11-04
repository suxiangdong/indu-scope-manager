import { request } from '@umijs/max';
import type { ApiEnvelope } from './auth';

export type AttributeListItem = {
  id: number;
  code: string;
  name: string;
  value_type: number;
  input_type: string;
  unit?: string;
  placeholder?: string;
  validation_rules?: string;
  help_text?: string;
  status: number;
  option_count: number;
  group_count: number;
  group_ids: number[];
  created_at: string;
  updated_at: string;
};

export type AttributeFormValues = {
  code: string;
  name: string;
  value_type: number;
  input_type: string;
  unit?: string;
  placeholder?: string;
  validation_rules?: string;
  help_text?: string;
  status?: number;
  group_ids?: number[];
};

export type AttributeOption = {
  id: number;
  attribute_id: number;
  code: string;
  name: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type AttributeOptionFormValues = {
  code: string;
  name: string;
  sort_order?: number;
  status?: number;
};

export type CategoryAttributeBinding = {
  category_id: number;
  category_name: string;
  attribute_id: number;
  attribute_code: string;
  attribute_name: string;
  group_id?: number;
  group_code?: string;
  is_required: number;
  is_filterable: number;
  is_searchable: number;
  sort_order: number;
  group_name?: string;
  created_at: string;
  updated_at: string;
};

export type CategoryAttributeFormValues = {
  category_id: number;
  attribute_id: number;
  group_id?: number | null;
  is_required?: number;
  is_filterable?: number;
  is_searchable?: number;
  sort_order?: number;
  group_name?: string;
};

export type AttributeGroup = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  status: number;
  attribute_count: number;
  category_count: number;
  created_at: string;
  updated_at: string;
};

export type AttributeGroupFormValues = {
  code: string;
  name: string;
  sort_order?: number;
  status?: number;
};

export type GroupAttribute = {
  group_id: number;
  attribute_id: number;
  code: string;
  name: string;
  value_type: number;
  input_type: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type CategoryGroupBinding = {
  category_id: number;
  category_name: string;
  group_id: number;
  group_code: string;
  group_name: string;
  sort_order: number;
  status: number;
  attribute_count: number;
  created_at: string;
  updated_at: string;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function listAttributes() {
  const response = await request<ApiEnvelope<{ items: AttributeListItem[] }>>(
    '/api/v1/admin/attributes',
    { method: 'GET' },
  );
  return ensureSuccess(response, '获取属性列表失败');
}

export async function createAttribute(data: Required<AttributeFormValues>) {
  const response = await request<ApiEnvelope<AttributeListItem>>(
    '/api/v1/admin/attributes/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增属性失败');
}

export async function updateAttribute(id: number, data: AttributeFormValues) {
  const response = await request<ApiEnvelope<AttributeListItem>>(
    '/api/v1/admin/attributes/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改属性失败');
}

export async function deleteAttribute(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/attributes/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除属性失败');
}

export async function listAttributeOptions(attributeId: number) {
  const response = await request<ApiEnvelope<{ items: AttributeOption[] }>>(
    '/api/v1/admin/attributes/options',
    { method: 'GET', params: { attribute_id: attributeId } },
  );
  return ensureSuccess(response, '获取属性选项失败');
}

export async function createAttributeOption(
  data: Required<AttributeOptionFormValues> & { attribute_id: number },
) {
  const response = await request<ApiEnvelope<AttributeOption>>(
    '/api/v1/admin/attributes/options/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增属性选项失败');
}

export async function updateAttributeOption(
  id: number,
  data: AttributeOptionFormValues,
) {
  const response = await request<ApiEnvelope<AttributeOption>>(
    '/api/v1/admin/attributes/options/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改属性选项失败');
}

export async function deleteAttributeOption(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/attributes/options/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除属性选项失败');
}

export async function listCategoryAttributeBindings(
  categoryId?: number,
  attributeId?: number,
) {
  const response = await request<
    ApiEnvelope<{ items: CategoryAttributeBinding[] }>
  >('/api/v1/admin/category-attributes', {
    method: 'GET',
    params:
      categoryId || attributeId
        ? {
            ...(categoryId ? { category_id: categoryId } : {}),
            ...(attributeId ? { attribute_id: attributeId } : {}),
          }
        : undefined,
  });
  return ensureSuccess(response, '获取类目属性绑定失败');
}

export async function saveCategoryAttributeBinding(
  data: CategoryAttributeFormValues,
) {
  const response = await request<ApiEnvelope<CategoryAttributeBinding>>(
    '/api/v1/admin/category-attributes/save',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '保存类目属性绑定失败');
}

export async function listAttributeGroups() {
  const response = await request<ApiEnvelope<{ items: AttributeGroup[] }>>(
    '/api/v1/admin/attribute-groups',
    { method: 'GET' },
  );
  return ensureSuccess(response, '获取属性分组失败');
}

export async function createAttributeGroup(
  data: Required<AttributeGroupFormValues>,
) {
  const response = await request<ApiEnvelope<AttributeGroup>>(
    '/api/v1/admin/attribute-groups/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增属性分组失败');
}

export async function updateAttributeGroup(
  id: number,
  data: AttributeGroupFormValues,
) {
  const response = await request<ApiEnvelope<AttributeGroup>>(
    '/api/v1/admin/attribute-groups/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改属性分组失败');
}

export async function deleteAttributeGroup(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/attribute-groups/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除属性分组失败');
}

export async function listGroupAttributes(groupId: number) {
  const response = await request<ApiEnvelope<{ items: GroupAttribute[] }>>(
    '/api/v1/admin/attribute-groups/attributes',
    { method: 'GET', params: { group_id: groupId } },
  );
  return ensureSuccess(response, '获取分组属性失败');
}

export async function saveGroupAttribute(data: {
  group_id: number;
  attribute_id: number;
  sort_order?: number;
}) {
  const response = await request<ApiEnvelope<GroupAttribute>>(
    '/api/v1/admin/attribute-groups/attributes/save',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '保存分组属性失败');
}

export async function deleteGroupAttribute(groupId: number, attributeId: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/attribute-groups/attributes/delete',
    {
      method: 'POST',
      data: { group_id: groupId, attribute_id: attributeId },
    },
  );
  return ensureSuccess(response, '移除分组属性失败');
}

export async function listCategoryGroups(categoryId: number) {
  const response = await request<ApiEnvelope<{ items: CategoryGroupBinding[] }>>(
    '/api/v1/admin/category-groups',
    { method: 'GET', params: { category_id: categoryId } },
  );
  return ensureSuccess(response, '获取类目分组失败');
}

export async function bindCategoryGroup(data: {
  category_id: number;
  group_id: number;
  sort_order?: number;
  status?: number;
}) {
  const response = await request<ApiEnvelope<CategoryGroupBinding>>(
    '/api/v1/admin/category-groups/bind',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '绑定类目分组失败');
}

export async function unbindCategoryGroup(categoryId: number, groupId: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/category-groups/unbind',
    {
      method: 'POST',
      data: { category_id: categoryId, group_id: groupId },
    },
  );
  return ensureSuccess(response, '解除类目分组失败');
}

export async function deleteCategoryAttributeBinding(
  categoryId: number,
  attributeId: number,
) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/category-attributes/delete',
    {
      method: 'POST',
      data: { category_id: categoryId, attribute_id: attributeId },
    },
  );
  return ensureSuccess(response, '删除类目属性绑定失败');
}
