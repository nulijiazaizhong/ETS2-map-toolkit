# EdgeOne Makers 部署

优先推荐使用 **Git 集成构建，并在构建时直接把仓库中的地图数据上传到 Blob**。用户不需要在本机安装游戏、提取瓦片或单独上传地图。

```text
导入 Git 项目
  -> npm run build:cloud
  -> 读取仓库 data/maps/v1.62/
  -> npm run upload:edgeone
  -> 写入 Makers Blob 并完成部署
```

Blob SDK 文档：<https://makers.edgeone.link/document/blob-storage>。API Token 创建方法：<https://makers.edgeone.link/document/api-token>。

## 1. 导入 Git 项目

在 Makers 控制台选择 **导入 Git 项目**，导入仓库根目录。不要只选择 `ets2-map/` 或 `deploy/edgeone/` 作为根目录。

根目录 `edgeone.json` 已声明：

```text
安装命令：npm install
构建命令：npm run build:cloud
输出目录：./ets2-map/dist-cloud
Node 版本：22.11.0
```

首次导入时可先使用默认构建命令创建项目。项目创建后，在控制台取得项目 ID，并创建具有 Blob 写入权限的 API Token。

## 2. 启用构建时直接上传 Blob

在 Makers 项目的构建环境变量中设置：

```text
EDGEONE_PROJECT_ID=替换为实际项目 ID
EDGEONE_API_TOKEN=替换为实际 API Token
EDGEONE_BLOB_STORE=ets2-map
MAP_VERSION=v1.62
```

`EDGEONE_BLOB_STORE` 可省略，默认值为 `ets2-map`。API Token 必须保存在受保护的环境变量中，不要写入 `edgeone.json`、源码或 Git。

根目录 `edgeone.json` 默认使用：

```json
"buildCommand": "npm run build:cloud && npm run upload:edgeone -- --resume"
```

该配置会覆盖控制台中的同名构建设置，应以仓库文件为准。推送代码后，Makers 会自动构建并直接从 Git 仓库读取 `data/maps/v1.62/`，再上传到当前项目的 Blob。上传失败会使构建失败，上传成功后才完成部署。

对象键为 `<版本>/<相对路径>`，例如：

```text
v1.62/ets/6/12/7.png
v1.62/tmp_s1/6/12/7.png
v1.62/Cities.json
v1.62/map-manifest.json
```

不要添加 `data/maps/` 前缀。上传默认使用 32 路并发，单文件失败会自动重试 3 次。遇到平台限流或网络不稳定时，可通过 `EDGEONE_UPLOAD_CONCURRENCY` 将并发调整为 16 或 8。构建超时后再次运行相同命令，会利用 `--resume` 从已有对象继续。

### 构建上传的代价

- 首次 Git 构建需要上传 17 万余个对象，会显著延长构建时间。
- 后续默认启用 `--resume`，查询对象清单并只补传缺失文件。
- 只希望更新页面时，可临时恢复 `npm run build:cloud`，避免读取和上传地图。

## 3. 验证部署

等待构建和 Blob 上传全部完成后检查：

```bash
curl -I https://example.com/v1.62/tmp_s1/6/12/7.png
curl https://example.com/v1.62/map-manifest.json
```

以下地址读取同一对象：

```text
https://example.com/tmp_s1/6/12/7.png
https://example.com/v1.62/tmp_s1/6/12/7.png
```

无版本地址使用 `MAP_VERSION`，固定版本地址始终使用 URL 中的版本。函数使用强一致 Blob 读取，上传完成后即可读取最新对象。

## 备用：从本机直接上传或断点续传

本机直接上传适合首次手动初始化、云端构建上传失败后的续传，或不希望每次 Git 构建都全量上传的情况。

本机克隆仓库并安装依赖：

```bash
git clone --recursive https://github.com/nulijiazaizhong/ETS2-map-toolkit.git
cd ETS2-map-toolkit
npm ci
npm run verify
```

在当前终端设置 `EDGEONE_PROJECT_ID`、`EDGEONE_API_TOKEN`、`EDGEONE_BLOB_STORE` 和 `MAP_VERSION`，然后执行：

```bash
npm run upload:edgeone
```

如果上传中断，保持相同环境变量并执行：

```bash
npm run upload:edgeone -- --resume
```

`--resume` 会列出 Blob 中已有对象，只补传缺失文件。看到 `Progress 175904/175904 objects for v1.62` 才表示当前清单全部处理完成。Token 只从环境变量读取，不要发到聊天或提交到仓库。

## 版本更新

以 `v1.63` 为例：

1. 将新地图提交到 `data/maps/v1.63/`。
2. 把 Makers 构建环境变量 `MAP_VERSION` 改为 `v1.63`。
3. 推送代码，构建过程会自动上传新版本并部署页面。

旧版本对象无需删除，`/v1.62/...` 与 `/v1.63/...` 可以并存。无版本地址会切换到新的 `MAP_VERSION`。
