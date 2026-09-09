# Open Offer Builder

基于 Twenty CRM 的开放式优惠管理工具，提供优惠创建、管理和预览功能。

## 项目概述

这是一个开源项目，基于 [open-twenty-dialer](https://github.com/...) 的架构模式，专注于优惠（Offer）的管理和展示。

### 核心特性

- 与 Twenty CRM 集成，使用 `agencyOffers` 对象存储数据
- 现代化的 Twenty CRM 风格 UI
- 支持优惠的创建、编辑、删除和预览
- 响应式设计，支持移动端
- 简化的认证系统

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- Twenty CRM REST API
- JWT 认证

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- @floating-ui/react

## 目录结构

```
open-offer-builder/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts        # 认证路由
│   │   │   └── offers.ts      # 优惠 CRUD 路由
│   │   ├── lib/
│   │   │   ├── twenty-client.ts  # Twenty CRM API 封装
│   │   │   └── logger.ts       # 日志工具
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT 认证中间件
│   │   ├── db/
│   │   │   └── twenty-pg.ts    # Twenty Postgres 连接
│   │   └── index.ts            # 入口文件
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # 登录页
│   │   │   ├── OffersPage.tsx      # 优惠列表页
│   │   │   ├── OfferDetailPage.tsx # 优惠详情页（表单构建器）
│   │   │   └── PreviewPage.tsx     # 公开预览页
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── Layout.tsx      # 布局组件
│   │   │   └── ui/
│   │   │       ├── WidgetCard.tsx  # 卡片组件
│   │   │       ├── Badge.tsx       # 徽章组件
│   │   │       ├── Toast.tsx       # 通知组件
│   │   │       └── Spinner.tsx     # 加载动画
│   │   ├── lib/
│   │   │   └── api.ts              # API 客户端
│   │   ├── App.tsx                 # 主应用组件
│   │   ├── main.tsx                # 入口文件
│   │   └── index.css               # 全局样式
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── package.json                  # 根 workspace
└── .env.example                  # 环境变量模板
```

## Twenty CRM 集成

### agencyOffers 对象结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 唯一标识符 |
| title | TEXT | 优惠标题 |
| name | TEXT | 内部名称 |
| heroH1 | TEXT | 英雄区主标题 |
| heroLede | RICH_TEXT | 英雄区描述（Markdown） |
| videoUrl | LINKS | 视频链接配置 |
| createdAt | DATE_TIME | 创建时间 |
| updatedAt | DATE_TIME | 更新时间 |

### API 端点

#### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

#### 优惠管理（需要认证）
- `GET /api/offers` - 获取所有优惠
- `GET /api/offers/:id` - 获取单个优惠
- `POST /api/offers` - 创建优惠
- `PATCH /api/offers/:id` - 更新优惠
- `DELETE /api/offers/:id` - 删除优惠

#### 公开预览
- `GET /preview/:industryId/:id` - 预览优惠页面（无需认证）

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Twenty CRM 实例（用于存储优惠数据）

### 安装

1. 克隆项目
```bash
git clone <repository-url>
cd open-offer-builder
```

2. 安装依赖
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的 Twenty CRM API 密钥
```

4. 启动开发服务器
```bash
# 启动后端
cd backend
npm run dev

# 启动前端（另一个终端）
cd frontend
npm run dev
```

5. 访问应用
- 前端：http://localhost:3000
- 后端：http://localhost:4000
- API 健康检查：http://localhost:4000/api/health

## 构建生产版本

### 后端
```bash
cd backend
npm run build
npm start
```

### 前端
```bash
cd frontend
npm run build
# 构建产物在 dist/ 目录
```

## 设计系统

本项目遵循 Twenty CRM 的设计规范：

- **颜色变量**: 使用 `--ods-*` CSS 自定义属性
- **间距**: 基于 4px 网格系统
- **圆角**: 4px（按钮/输入框），6px（卡片/下拉菜单）
- **字体**: 系统字体栈，11-13px 为标准字号

详见 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## 对比 open-twenty-dialer

| 特性 | open-twenty-dialer | open-offer-builder |
|------|-------------------|-------------------|
| 核心对象 | agencyProspects, agencyLeads, agencyCampaigns | agencyOffers |
| 主要功能 | 冷呼叫管理 | 优惠创建和展示 |
| 电话功能 | ✅ | ❌ |
| 呼叫记录 | ✅ | ❌ |
| 脚本管理 | ✅ | ❌ |
| 公开预览 | ❌ | ✅ |
| UI 风格 | Twenty CRM 风格 | Twenty CRM 风格 |

## 扩展开发

### 添加新的优惠字段

1. 在 Twenty CRM 中创建新字段（使用 Metadata API）
2. 更新 [backend/src/routes/offers.ts](backend/src/routes/offers.ts) 中的处理逻辑
3. 更新 [frontend/src/lib/api.ts](frontend/src/lib/api.ts) 中的类型定义
4. 在 [frontend/src/pages/OfferDetailPage.tsx](frontend/src/pages/OfferDetailPage.tsx) 中添加表单字段

### 自定义预览样式

编辑 [frontend/src/pages/PreviewPage.tsx](frontend/src/pages/PreviewPage.tsx) 中的渲染逻辑。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

基于 [open-twenty-dialer](https://github.com/...) 架构开发
