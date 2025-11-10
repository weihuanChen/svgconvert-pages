- # 混合架构技术方案：高性能 SVG 转换服务 (Next.js + Cloudflare + VPS)

  项目名称： SVG Utility Tool (Cloudflare Hybrid)

  版本： 2.0 (CF 适配版)

  日期： 2025年11月

  基于文档： 产品需求文档 (PRD) v1.0

  ## 1. 架构总览 (Architecture Overview)

  本项目采用**高性能混合架构**，利用 Cloudflare 的全球边缘能力和 VPS 的原生计算能力。

  | **组件**             | **技术栈**                          | **部署环境**           | **主要职责**                                                 |
  | -------------------- | ----------------------------------- | ---------------------- | ------------------------------------------------------------ |
  | **前端 (Client)**    | **Next.js (React)**                 | **Cloudflare Pages**   | UI 渲染、国际化路由、文件上传、状态轮询与下载管理。          |
  | **API 网关/协调层**  | **Cloudflare Workers (TypeScript)** | **Cloudflare Edge**    | 用户认证、文件上传中转至 R2、任务投递至 Queue、处理 VPS 回调、生成安全下载链接。 |
  | **计算层 (Compute)** | **Hono (Node.js)**                  | **VPS / Docker**       | 运行完整的 Node.js 环境，执行 CPU/内存密集型转换，使用 **Sharp/Inkscape** 等原生库。 |
  | **文件存储**         | **Cloudflare R2**                   | **Cloudflare Storage** | 存储所有原始文件和转换后的结果文件。**零出口费用。**         |
  | **任务队列**         | **Cloudflare Queues**               | **Cloudflare Service** | 异步解耦 Workers 和 VPS，确保高可靠任务分发。                |
  | **状态/元数据**      | **Cloudflare D1 / KV**              | **Cloudflare Service** | 存储任务状态 (`taskID`、`fileKey`、`status`、`userID`)。     |

  ## 2. 计算层技术栈与模块设计 (Hono/VPS/Docker)

  ### 2.1 框架与环境

  - **框架：** Hono.js
  - **运行时：** Node.js (通过 Docker 容器化部署)
  - **存储依赖:** 使用 **AWS SDK** 访问兼容 S3 协议的 Cloudflare R2。
  - **核心优势：** Hono 轻量、高性能，用于处理队列消费和 R2/Worker 交互的 API 逻辑。

  ### 2.2 核心处理库 (Conversion Engines)

  所有 CPU 密集型的工作都将在 VPS 的 Docker 容器中处理，以利用原生库的性能。

  | **任务**           | **推荐库/技术**               | **职责**                                                     |
  | ------------------ | ----------------------------- | ------------------------------------------------------------ |
  | **SVG 转 PNG/JPG** | `Sharp`                       | 高效的 SVG 渲染和位图导出，利用底层 libvips 库。             |
  | **PDF/EPS 转换**   | `Inkscape` 或 `Ghostscript`   | 通过 Node.js 的 `child_process` 调用，处理专业的矢量格式转换。 |
  | **PNG/JPG 转 SVG** | `Potrace` 或 `ImageTracer.js` | 实现位图的矢量化（Trace）。                                  |
  | **文件 I/O**       | `@aws-sdk/client-s3`          | 负责 R2 的文件拉取和结果回传。                               |

  ### 2.3 任务消费与回调机制

  计算层的主要入口是 **Cloudflare Queues 消费者**。

  1. **Queue 消费:** VPS 上的 Hono 服务持续监听 Cloudflare Queues。
  2. **回调 URL:** 任务完成后，VPS 必须向 Worker API (`POST /api/callback`) 发送状态更新，而不是直接修改文件服务器状态。
  3. **文件清理:** 由于文件存储在 R2，VPS **不负责**定时清理。Worker 端将配合 R2 的生命周期规则或在下载完成后触发删除操作。

  ## 3. 边缘层 (Cloudflare Workers) API 接口设计

  Workers 作为统一的 API 网关，负责协调前后端和所有 Cloudflare 服务。

  | **方法** | **路径**                | ***\* Worker 职责\****                                       |
  | -------- | ----------------------- | ------------------------------------------------------------ |
  | `POST`   | `/api/upload`           | 接收文件 $\rightarrow$ 存入 **R2** $\rightarrow$ 记录 **D1/KV** $\rightarrow$ 推送任务至 **Queues** $\rightarrow$ 返回 `taskId`。 |
  | `POST`   | `/api/callback`         | 接收 VPS 回调 $\rightarrow$ 验证授权 $\rightarrow$ 更新 **D1/KV** 任务状态为 `COMPLETED`。 |
  | `GET`    | `/api/status/:taskId`   | 查询 **D1/KV** $\rightarrow$ 返回任务当前状态。              |
  | `GET`    | `/api/download/:taskId` | 验证用户权限 $\rightarrow$ 从 **D1/KV** 获取 `fileKey` $\rightarrow$ 生成 **R2 Signed URL** $\rightarrow$ 返回安全链接。 |
  | `DELETE` | `/api/cleanup/:taskId`  | (可选) 验证用户权限 $\rightarrow$ 从 **R2** 删除原始文件和转换结果。 |

  ## 4. 前端技术栈与 i18n 实现 (Next.js/Cloudflare Pages)

  ### 4.1 框架与部署

  - **框架：** Next.js (App Router)
  - **部署：** **Cloudflare Pages** (使用 Pages 的 Next.js 适配器)
  - **优势：** 利用 Pages 的全球 CDN，配合 Next.js 的 SSR/ISR/SSG 能力，实现高性能部署。

  ### 4.2 国际化 (i18n) 实施方案

  采用 Next.js 的路由和配置来实现 i18n，确保 URL 结构清晰。

  1. **语言配置：** 在 `next.config.js` 中定义支持的语言，部署在 Pages 上。
  2. **路由结构：** URL 自动包含语言前缀，例如 `/[YourDomain].net/zh/tool`。

  ### 4.3 用户界面 (UI/UX) 关键点

  1. **响应式设计：** 仅使用 **Tailwind CSS**，确保在 Cloudflare Pages 上部署时，页面在所有设备上都完美适应。
  2. **异步状态反馈：** 前端必须轮询 Workers 的 `/api/status/:taskId` 接口，以实时更新转换进度和状态。

  ## 5. 数据流与状态管理 (Data Flow & State)

  ### 5.1 核心转换流程图 (CF Hybrid Model)

  ```
  graph TD
      A[用户上传文件 + 参数] --> B{Next.js Frontend on Pages};
      B --> C[Cloudflare Worker (API Gateway): POST /api/upload];
      C --> D[R2: 存储原始文件];
      C --> E[D1/KV: 记录 PENDING 状态];
      C --> F[Cloudflare Queues: 推送任务负载];
      F --> G[VPS Hono Server (队列消费者)];
      G --> H[VPS: 从 R2 拉取文件];
      H --> I[VPS: Sharp/Inkscape 转换计算];
      I --> J[VPS: 结果回传至 R2];
      J --> K[VPS: POST /api/callback to Worker];
      K --> L[Worker: 更新 D1/KV 为 COMPLETED];
      C --> M{Frontend: 轮询 GET /api/status/:taskId};
      L --> M;
      M -- 状态更新 --> P[Frontend 显示: '下载' 按钮];
      P --> Q[Worker: GET /api/download/:taskId];
      Q --> R[Worker: 生成 R2 Signed URL];
      R --> S[用户直接从 R2 高速下载];
      
  ```

  ## 6. 可扩展性与部署规划

  - **R2 生命周期:** 在 R2 存储桶上配置生命周期规则，自动删除超过 30 分钟未下载的文件，作为二次清理机制。
  - **水平扩展:** Worker 和 Queues 自动扩展。VPS 上的 Hono 服务应作为无状态容器，可以轻松在 VPS 上增加 Docker 实例（或迁移到 Kubernetes）以应对高并发任务量。