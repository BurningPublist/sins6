# 低代码自动化流程平台

> 一个类似 n8n 和 Coze 的可视化自动化工作流平台，使用 TypeScript 全栈开发

## 🎯 项目简介

这是一个毕业论文项目，旨在构建一个简化版的低代码自动化平台。用户可以通过拖拽的方式创建自动化工作流，支持多种触发器和动作节点。

### 核心功能
- 🎨 **可视化流程编辑器** - 拖拽式节点连接界面
- ⚡ **自动化执行引擎** - 支持异步流程执行
- 🔧 **多种节点类型** - 定时器、HTTP请求、数据处理、条件判断
- 📊 **实时监控** - WebSocket实时状态更新
- 💾 **流程管理** - 保存、加载、版本管理

### 技术特色
- 🚀 **TypeScript全栈** - 前后端类型安全
- 🎯 **模块化设计** - 清晰的架构分层
- 📚 **学习友好** - 详细注释和文档
- 🔧 **可扩展** - 插件化节点系统

## 🛠 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化前端框架
- **React Flow** - 可视化流程编辑器
- **Ant Design** - UI组件库
- **Zustand** - 轻量级状态管理
- **Vite** - 快速构建工具

### 后端
- **Node.js** + **Express** + **TypeScript** - 服务端框架
- **Socket.io** - 实时通信
- **SQLite** + **better-sqlite3** - 轻量级数据库
- **Zod** - 数据验证

### 开发工具
- **pnpm** - 包管理器
- **ESLint** + **Prettier** - 代码规范
- **Jest** - 单元测试
- **Playwright** - E2E测试

## 📁 项目结构

```
low-code-automation/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── stores/         # Zustand状态管理
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js后端服务
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── engine/         # 执行引擎
│   │   ├── middleware/     # 中间件
│   │   └── types/          # TypeScript类型
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # 前后端共享代码
│   ├── types/              # 共享类型定义
│   ├── validators/         # 数据验证
│   └── utils/              # 共享工具
└── docs/                    # 项目文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
# 安装所有依赖
pnpm install
```

### 开发模式
```bash
# 同时启动前后端开发服务器
pnpm run dev

# 或者分别启动
pnpm run dev:frontend  # 前端: http://localhost:5173
pnpm run dev:backend   # 后端: http://localhost:3000
```

### 构建生产版本
```bash
pnpm run build
```

### 运行测试
```bash
pnpm run test
```

### 代码检查
```bash
pnpm run lint
pnpm run type-check
```

## 📖 核心概念

### 工作流 (Workflow)
工作流是由多个节点组成的有向图，定义了数据的流向和处理逻辑。

### 节点 (Node)
节点是工作流的基本执行单元，包括：
- **触发器节点** - 定时器、Webhook等
- **动作节点** - HTTP请求、数据转换等  
- **逻辑节点** - 条件判断、循环等
- **输出节点** - 结果展示、通知等

### 执行引擎 (Execution Engine)
负责解析工作流定义，按照依赖关系执行节点，管理执行状态。

## 🎨 界面预览

### 流程编辑器
- 拖拽式节点创建
- 可视化连线
- 实时配置面板
- 自动布局优化

### 执行监控
- 实时状态显示
- 执行历史记录
- 错误日志查看
- 性能指标监控

## 🔧 开发指南

### 添加新节点类型
1. 在 `shared/types/nodes.ts` 中定义节点类型
2. 在 `backend/src/engine/executors/` 中实现执行器
3. 在 `frontend/src/components/nodes/` 中实现UI组件
4. 注册到节点注册表

### API接口规范
- 使用RESTful设计
- 统一的响应格式
- 完整的错误处理
- TypeScript类型定义

### 代码规范
- 使用ESLint + Prettier
- 遵循TypeScript严格模式
- 详细的JSDoc注释
- 单元测试覆盖

## 📚 学习资源

### 核心技术文档
- [React Flow 官方文档](https://reactflow.dev/)
- [Socket.io 官方文档](https://socket.io/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

### 参考项目
- [n8n](https://github.com/n8n-io/n8n) - 开源工作流自动化工具
- [Node-RED](https://github.com/node-red/node-red) - 可视化编程工具

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢 n8n 和 Coze 提供的设计灵感
- 感谢开源社区提供的优秀工具和库
- 感谢导师和同学们的指导和建议

---

**开发者**: 大三学生  
**项目类型**: 毕业论文项目  
**开发时间**: 2024年12月