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

如果当前终端不支持行首环境变量，也可以先执行 `export PORT=8001`，再执行 `npm run dev`。本项目直接使用 npm，不要求安装 pnpm。

首次换电脑时，建议先启动后端并执行数据库迁移，再启动本项目。后端仓库的
[`docs/development-onboarding.md`](https://github.com/suxiangdong/indu-scope-backend/blob/main/docs/development-onboarding.md)
包含 MySQL、Redis、管理员初始化和微信小程序的完整启动顺序。

## 生产构建

```bash
npm run build
npm run preview
npm run tsc
```

注意：仓库现有 `preview` 脚本使用 8000 端口；如果后端正在运行，请先停止后端或按需调整预览端口，开发联调统一使用 `PORT=8001 npm run dev`。

## 当前页面

- `/user/login`：管理员账号登录
- `/dashboard`：管理工作台
- `/analytics`：产品和需求点击统计
- `/operations/users`：前台用户管理
- `/operations/verifications`：个人/企业认证审核
- `/operations/requirements`：需求审核
- `/operations/vip-orders`：会员订单
- `/operations/vip-refunds`：退款管理
- `/system/admins`：管理员账号列表（仅超级管理员）
- `/system/store-platforms`：店铺平台维护
- `/system/app-pages`：关于我们与联系我们内容管理
- `/system/vip-plans`：会员套餐
- `/system/vip-agreements`：会员服务协议和自动续费协议
- `/catalog/categories`：产品类目管理
- `/catalog/hot-categories`：首页热门分类
- `/catalog/attributes`：全局产品属性和属性选项管理
- `/catalog/attribute-groups`：可复用属性分组、分组属性和类目绑定管理
- `/catalog/products`：产品审核和上下架
- `/catalog/stock-units`：库存单位和类目绑定

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

认证成功后，前端将 JWT 保存到浏览器本地存储，并自动通过 `Authorization: Bearer <token>` 发送。HTTP 401 会清除登录状态并跳转登录页；HTTP 403 只提示权限不足。超级管理员可以管理管理员账号、切换前台用户角色并发起退款，普通管理员可以查看订单与退款记录。前端路由权限只负责界面控制，后端独立执行鉴权。

## 提交前检查

```bash
npm run lint
npx playwright install chromium --only-shell
npm test
npm run build
git diff --check
```

提交源码、配置模板和 `package-lock.json`。本地 `.env*`、`.dev.vars*`、依赖、Umi 生成目录、构建产物、日志和测试报告由 `.gitignore` 排除。

## 项目结构

```text
config/                 Umi Max 配置和路由
src/pages/user/login/   管理员登录页
src/pages/dashboard/    管理工作台
src/pages/customer-users/ 前台用户管理页
src/pages/verifications/ 认证审核页
src/pages/store-platforms/ 店铺平台页
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
