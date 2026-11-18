# Cloudflare Pages / Worker

此目录包含 Pages Functions、独立 Worker 和 R2 并发上传脚本。优先推荐使用 **Connect GitHub / Workers Builds，在构建时直接把仓库中的地图数据上传到 R2**。

```text
Connect GitHub
  -> npm run build:cloud
  -> 读取仓库 data/maps/v1.62/
  -> npm run upload:cloudflare -- --resume
  -> 写入 Cloudflare R2 并部署 Worker
```

## 1. 准备 R2 和上传凭证

```bash
npm ci
npx wrangler login
npx wrangler r2 bucket create ets2-map
```

创建名为 `ets2-map` 的桶，或修改两个 Wrangler 配置中的 `bucket_name`。绑定名 `MAP_DATA` 不要修改。

在 Cloudflare 控制台进入 **R2 object storage**，在 **Account Details** 旁选择 **Manage API Tokens**，创建 Account API Token：

1. 权限选择 **Object Read & Write**。
2. 可将范围限制为 `ets2-map` 桶。
3. 创建后取得 **Access Key ID** 和 **Secret Access Key**。
4. 在 Cloudflare 控制台取得账户 ID。

官方说明：<https://developers.cloudflare.com/r2/api/s3/tokens/>。

## 2. Connect GitHub 并在构建时上传 R2（推荐）

在 Cloudflare 控制台进入 **Workers & Pages**，创建或选择 `ets2-map-toolkit` Worker，打开 **Settings > Builds**，在 **Git Repository** 中选择 **Manage**。授权 Cloudflare GitHub 应用，并选择 `nulijiazaizhong/ETS2-map-toolkit` 仓库。

在 Workers Builds 的构建环境变量中设置：

```text
CLOUDFLARE_ACCOUNT_ID=实际账户 ID
CLOUDFLARE_R2_ACCESS_KEY_ID=实际 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=实际 Secret Access Key
CLOUDFLARE_R2_BUCKET=ets2-map
MAP_VERSION=v1.62
```

密钥必须保存在受保护的环境变量中，不要写入源码、Wrangler 配置或 GitHub。

构建设置如下：

```text
生产分支：main
构建命令：npm run build:cloud && npm run upload:cloudflare -- --resume
部署命令：npx wrangler deploy --config wrangler.worker.toml
根目录：保持仓库根目录
```

保存后，每次 GitHub 推送都会：

1. 拉取仓库并构建轻量页面。
2. 读取 `data/maps/` 中 `MAP_VERSION` 对应的目录。
3. 查询 R2 对象清单，跳过已有对象，只上传缺失文件。
4. 上传完成后部署 Worker；上传失败会使构建失败。

首次上传仍需处理 17 万余个对象。后续构建使用 `--resume` 增量补传，避免每次修改页面都覆盖全部对象。对象键为 `<版本>/<相对路径>`，例如 `v1.62/tmp_s1/6/12/7.png`，不能包含 `data/maps/` 前缀。

官方 Git 集成说明：<https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/index.html>。

## 3. 验证部署

等待构建、R2 上传和 Worker 部署全部完成后检查：

```bash
curl -I https://example.com/v1.62/tmp_s1/6/12/7.png
curl https://example.com/v1.62/map-manifest.json
```

无版本地址使用 `MAP_VERSION`，`/v1.62/...` 固定读取指定版本。看到 `Progress 175904/175904 objects for v1.62` 才表示当前清单全部处理完成。

## 4. 备用：本机直接上传或断点续传

本机上传适合首次手动初始化、云端构建上传失败后的恢复，或不希望通过 Git 构建上传的情况。

在当前终端设置与上文相同的环境变量，然后执行：

```bash
npm run upload:cloudflare
```

PowerShell 使用 `$env:变量名="值"` 设置环境变量。脚本使用 8 路并发，单文件失败会自动重试 3 次。

上传中断时执行：

```bash
npm run upload:cloudflare -- --resume
```

不要将密钥提交到 Git 或发到聊天中。

## 5. 使用 CLI 部署 Worker

不使用 Git 集成时：

```bash
npm run build:cloud
npx wrangler deploy --config wrangler.worker.toml
```

Worker 将数据请求发送到 R2，其余请求交给 `ASSETS`。`dist-cloud/.assetsignore` 会排除 Pages Functions、Makers Functions 和共享服务端代码，避免作为公开静态资源上传。

## 6. 或部署到 Cloudflare Pages

```bash
npm run build:cloud
npx wrangler pages deploy ets2-map/dist-cloud --project-name ets2-map-toolkit --branch main
```

构建会把 `pages/[[path]].js` 放到 `dist-cloud/functions/`。根配置声明了 `pages_build_output_dir`、`MAP_DATA` R2 绑定和默认 `MAP_VERSION`。

Pages 与 Worker 选择一种作为同一个域名的入口即可。

## 版本与地址

以 `v1.63` 为例，将新地图提交到 `data/maps/v1.63/`，把构建环境变量及两个 Wrangler 配置中的 `MAP_VERSION` 改为 `v1.63`，再推送代码。Git 构建会使用 `--resume` 上传新版本对象并部署，旧版本无需删除。

```text
https://example.com/ets/{z}/{x}/{y}.png
https://example.com/tmp_s1/{z}/{x}/{y}.png
https://example.com/v1.62/ets/{z}/{x}/{y}.png
https://example.com/v1.62/tmp_s1/{z}/{x}/{y}.png
```

Pages 配置参考：<https://developers.cloudflare.com/pages/functions/wrangler-configuration/>。R2 Workers API 参考：<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>。
