# 工业视界管理后台

工业视界管理后台，基于 React 19、TypeScript、Umi Max 4、Ant Design 6 和 Ant Design Pro Components 构建。

## 环境要求

- Node.js 22+
- npm 10+
- 后端服务：`indu-scope-backend`

## 本地开发

```bash
npm install
PORT=8001 npm run dev
```

管理端开发服务器建议访问 `http://localhost:8001`，`/api/` 请求代理到
`http://127.0.0.1:8000`。请先启动后端服务并完成管理员登录。

生产构建和预览：

```bash
npm run build
npm run preview
```

## 当前页面

- `/user/login`：管理员登录
- `/dashboard`：管理工作台
- `/system/admins`：管理员账号
- `/catalog/categories`：产品类目管理
- `/catalog/attributes`：全局属性和属性选项管理
- `/catalog/attribute-groups`：可复用属性分组、分组属性和叶子类目绑定
- `/catalog/products`：产品管理占位页

## 属性管理模型

属性管理采用“全局属性 → 可复用分组 → 叶子类目绑定”的模型：

```text
属性 attributes
    ↓ 多对多
属性分组 attribute_groups
    ↓ 多对多
叶子类目 categories
```

推荐操作顺序：

1. 在“属性管理”创建属性，可选填所属分组。
2. 在“属性分组”创建分组并管理分组属性。
3. 将分组绑定到叶子类目。
4. 在类目绑定记录上配置属性是否必填和排序。

当前页面不展示筛选和搜索配置；建立搜索引擎后再开放。只有输入方式为 `select` 或
`multi_select` 时，属性列表才显示“选项”操作和选项数。

完整数据模型、接口、迁移和删除约束见后端仓库的
[`docs/attribute-management.md`](https://github.com/suxiangdong/indu-scope-backend/blob/main/docs/attribute-management.md)。

## 后端接口

管理端通过以下后端接口工作：

```text
POST /api/v1/admin/auth/login
GET  /api/v1/admin/me
GET  /api/v1/admin/categories
GET  /api/v1/admin/attributes
GET  /api/v1/admin/attribute-groups
GET  /api/v1/admin/attribute-groups/attributes?group_id=...
GET  /api/v1/admin/category-groups?category_id=...
GET  /api/v1/admin/category-attributes?category_id=...
```

属性、分组、类目绑定的新增、修改、删除接口详见后端 API 定义和文档。

## 项目结构

```text
config/routes.ts                 页面路由
src/pages/categories/            类目管理页
src/pages/attributes/            属性管理页
src/pages/attribute-groups/      属性分组管理页
src/services/categories.ts       类目接口封装
src/services/attributes.ts       属性、选项和分组接口封装
src/requestErrorConfig.ts        JWT、请求错误和登录失效处理
```

## 换电脑继续开发

```bash
git clone git@github.com:suxiangdong/indu-scope-backend.git
git clone git@github.com:suxiangdong/indu-scope-manager.git

cd indu-scope-backend
cp manifest/config/config.example.yaml manifest/config/config.yaml
# 填写数据库、Redis 和 JWT 配置
go mod download
go run . migrate up
go run .

cd ../indu-scope-manager
npm install
npm run tsc
npm run build
PORT=8001 npm run dev
```

不要提交后端 `manifest/config/config.yaml`、前端 `.env`、构建产物 `dist/` 或任何真实凭据。
