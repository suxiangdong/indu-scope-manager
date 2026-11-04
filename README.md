# 工业视界管理后台

基于 React、TypeScript、Ant Design Pro v6 的管理后台，使用 Umi Max 4 和 Ant Design 6 构建。

## 环境要求

- Node.js 22+
- npm 10+

## 本地开发

```bash
npm install
PORT=8001 npm run dev
```

开发服务器建议访问 `http://localhost:8001`，`/api/` 请求会代理到后端 `http://127.0.0.1:8000`。

## 生产构建

```bash
npm run build
npm run preview
```

## 当前页面

- `/user/login`：管理员账号登录
- `/dashboard`：管理工作台
- `/users`：管理员账号列表
- `/catalog/categories`：产品类目管理
- `/catalog/attributes`：全局产品属性和属性选项管理
- `/catalog/attribute-groups`：可复用属性分组、分组属性和类目绑定管理

属性模型、迁移和跨电脑接续说明见
[后端属性管理文档](https://github.com/suxiangdong/indu-scope-backend/blob/main/docs/attribute-management.md)。

## 后端接口约定

管理后台使用独立的管理员接口：

```text
POST /api/v1/admin/auth/login
GET  /api/v1/admin/me
GET  /api/v1/admin/users
GET  /api/v1/admin/categories
GET  /api/v1/admin/attributes
POST /api/v1/admin/attributes/create
POST /api/v1/admin/attributes/update
POST /api/v1/admin/attributes/delete
GET  /api/v1/admin/attributes/options?attribute_id=...
POST /api/v1/admin/attributes/options/create
POST /api/v1/admin/attributes/options/update
POST /api/v1/admin/attributes/options/delete
GET  /api/v1/admin/attribute-groups
POST /api/v1/admin/attribute-groups/create
POST /api/v1/admin/attribute-groups/update
POST /api/v1/admin/attribute-groups/delete
GET  /api/v1/admin/attribute-groups/attributes?group_id=...
POST /api/v1/admin/attribute-groups/attributes/save
POST /api/v1/admin/attribute-groups/attributes/delete
GET  /api/v1/admin/category-groups?category_id=...
POST /api/v1/admin/category-groups/bind
POST /api/v1/admin/category-groups/unbind
GET  /api/v1/admin/category-attributes?category_id=...&attribute_id=...
POST /api/v1/admin/category-attributes/save
POST /api/v1/admin/category-attributes/delete
```

认证成功后，前端将 JWT 保存到浏览器本地存储，并自动通过 `Authorization: Bearer <token>` 发送。后端仍然需要独立实现 `admin_users`、管理员权限和管理接口；前端路由权限只负责界面控制，不能替代后端鉴权。

## 项目结构

```text
config/                 Umi Max 配置和路由
src/pages/user/login/   管理员登录页
src/pages/dashboard/    管理工作台
src/pages/users/        管理员账号页
src/pages/categories/   产品类目管理页
src/pages/attributes/   产品属性管理页
src/pages/attribute-groups/ 属性分组管理页
src/services/auth.ts    管理员认证接口
src/services/admin.ts   管理后台接口
src/services/categories.ts 类目管理接口
src/services/attributes.ts 属性、选项和类目绑定接口
src/requestErrorConfig.ts 统一请求、JWT 和错误处理
```
