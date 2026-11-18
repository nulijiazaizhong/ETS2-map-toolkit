# EdgeOne Makers 部署

推荐使用 **Git 集成构建页面与 Functions + 本地脚本上传 Blob**。地图数据不进入云端静态产物，函数根据 URL 中的版本读取 Blob。

```text
Git 提交 -> Makers 自动构建 dist-cloud/ 和 Functions
本机 data/maps/v1.62/ -> npm run upload:edgeone -> Makers Blob
```

Blob SDK 文档：<https://makers.edgeone.link/document/blob-storage>。

## 1. 使用 Git 集成创建项目

在 Makers 控制台选择 Git 集成，导入仓库根目录。不要只选择 `ets2-map/` 或 `deploy/edgeone/` 作为根目录。

根目录 `edgeone.json` 已声明：

```text
安装命令：npm install
构建命令：npm run build:cloud
输出目录：./ets2-map/dist-cloud
Node 版本：22.11.0
```

在项目环境变量中设置：

```text
MAP_VERSION=v1.62
EDGEONE_BLOB_STORE=ets2-map
```

`EDGEONE_BLOB_STORE` 可省略，默认值为 `ets2-map`。触发首次构建后，Makers 会生成静态页面、根目录 `cloud-functions/` 和轻量 `dist-cloud/`。此时地图请求会返回 404，直到本地数据上传完成。

Functions 运行时不需要项目 ID 或 API Token，平台会自动关联当前项目的 Blob。

## 2. 在本地上传地图到 Blob

本机克隆仓库后，仓库已经包含当前版本数据，无需重新安装游戏或提取瓦片：

```bash
git clone --recursive https://github.com/nulijiazaizhong/ETS2-map-toolkit.git
cd ETS2-map-toolkit
npm ci
npm run verify
```

在 Makers 控制台取得项目 ID 和具有 Blob 写入权限的 API Token，并在当前 Git Bash 终端设置：

```bash
export EDGEONE_PROJECT_ID="pages-xxxxxxxx"
export EDGEONE_API_TOKEN="替换为真实 Token"
export EDGEONE_BLOB_STORE="ets2-map"
export MAP_VERSION="v1.62"
npm run upload:edgeone
```

上传脚本使用 8 路并发，每 500 个对象输出一次进度。对象键为 `<版本>/<相对路径>`，例如：

```text
v1.62/ets/6/12/7.png
v1.62/tmp_s1/6/12/7.png
v1.62/Cities.json
v1.62/map-manifest.json
```

不要上传成 `data/maps/v1.62/...`。同一版本重复上传会覆盖同名对象，但不会删除旧版本。单文件失败会自动重试 3 次；仍失败时，可在原终端执行 `npm run upload:edgeone -- --resume`，脚本会列出已有对象并只补传缺失文件。Token 只从环境变量读取，不要写入仓库或构建日志。

## 3. 验证部署

等待首次构建和本地上传都完成后检查：

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

## 可选：让 Git 构建同时上传 Blob

当前脚本支持在构建命令中顺序执行上传，但**不建议作为默认流程**。Makers 构建环境不属于 Functions 运行时，因此必须额外向构建环境提供项目 ID 和 API Token。

在项目构建环境变量中设置：

```text
EDGEONE_PROJECT_ID=pages-xxxxxxxx
EDGEONE_API_TOKEN=替换为真实 Token
EDGEONE_BLOB_STORE=ets2-map
MAP_VERSION=v1.62
```

将根目录 `edgeone.json` 的 `buildCommand` 从：

```json
"buildCommand": "npm run build"
```

改为：

```json
"buildCommand": "npm run build:cloud && npm run upload:edgeone"
```

之后每次 Git 构建都会先构建页面，再上传 `MAP_VERSION` 对应的完整版本目录；上传失败会使构建失败，上传成功后才会完成部署。

注意：

- 每次推送都会重新上传 17 万余个对象，即使只修改了页面或文档。
- 默认构建不会启用 `--resume`，同名对象会全部覆盖。
- 全量上传会显著延长构建时间，并增加 API 请求和存储操作量。
- API Token 必须配置为受保护的构建环境变量，不能提交到 `edgeone.json`。
- 只更新页面时，推荐保持默认 `npm run build:cloud`；只有地图数据变化时才在本机执行 `npm run upload:edgeone`。

## 版本更新

以 `v1.63` 为例，在本机上传新版本：

```bash
export MAP_VERSION="v1.63"
npm run upload:edgeone
```

上传完成后，将 Makers 项目的 `MAP_VERSION` 改为 `v1.63` 并重新部署。旧版本对象无需删除，`/v1.62/...` 与 `/v1.63/...` 可以并存。

如果启用了构建时上传，则还需在构建环境变量中同步更新 `MAP_VERSION`。
