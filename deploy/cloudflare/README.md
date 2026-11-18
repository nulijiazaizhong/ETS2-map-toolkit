# Cloudflare Pages / Worker

此目录包含 Pages Functions、独立 Worker 和 R2 并发上传脚本。Pages 与 Worker 都从同一个 R2 桶读取地图数据。根目录 `wrangler.toml` 用于 Pages，`wrangler.worker.toml` 用于 Worker。

## 1. 登录并准备 R2

```bash
npm ci
npx wrangler login
npx wrangler r2 bucket create ets2-map
```

创建名为 `ets2-map` 的桶，或修改两个 Wrangler 配置中的 `bucket_name`。绑定名 `MAP_DATA` 不要修改。

## 2. 从项目目录上传到 R2

全量地图包含 17 万余个对象，使用项目提供的 S3 并发上传脚本，不要逐个启动 Wrangler。

在 Cloudflare 控制台进入 **R2 object storage**，在 **Account Details** 旁选择 **Manage API Tokens**，创建 Account API Token：

1. 权限选择 **Object Read & Write**。
2. 可将范围限制为 `ets2-map` 桶。
3. 创建后取得 **Access Key ID** 和 **Secret Access Key**。
4. 在 Cloudflare 控制台取得账户 ID。

官方说明：<https://developers.cloudflare.com/r2/api/s3/tokens/>。

在本机当前终端设置环境变量，不要将密钥提交到 Git 或发到聊天中：

```bash
export CLOUDFLARE_ACCOUNT_ID="账户 ID"
export CLOUDFLARE_R2_ACCESS_KEY_ID="Access Key ID"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="Secret Access Key"
export CLOUDFLARE_R2_BUCKET="ets2-map"
export MAP_VERSION="v1.62"
npm run upload:cloudflare
```

PowerShell 使用 `$env:变量名="值"` 设置相同环境变量。

脚本使用 8 路并发，单文件失败会自动重试 3 次。对象键保持 `<版本>/<相对路径>`，例如：

```text
v1.62/tmp_s1/6/12/7.png
```

上传中断时执行：

```bash
npm run upload:cloudflare -- --resume
```

`--resume` 使用 R2 对象清单跳过已有文件，只补传缺失对象。看到 `Progress 175904/175904 objects for v1.62` 才表示当前清单全部处理完成。

## 3. 部署到 Cloudflare Worker

```bash
npm run build:cloud
npx wrangler deploy --config wrangler.worker.toml
```

Worker 将数据请求发送到 R2，其余请求交给 `ASSETS`。`dist-cloud/.assetsignore` 会排除 Pages Functions、Makers Functions 和共享服务端代码，避免作为公开静态资源上传。

### 连接 GitHub（Workers Builds）

1. 在 Cloudflare 控制台进入 **Workers & Pages**，选择已部署的 `ets2-map-toolkit` Worker。
2. 打开 **Settings > Builds**，在 **Git Repository** 中选择 **Manage**。
3. 授权 Cloudflare GitHub 应用，并选择 `nulijiazaizhong/ETS2-map-toolkit` 仓库。
4. 生产分支设置为 `main`，构建命令设置为 `npm run build:cloud`。
5. 部署命令设置为 `npx wrangler deploy --config wrangler.worker.toml`，根目录保持仓库根目录。
6. 保存后推送提交即可自动构建和部署。

R2 对象不会随 Worker 静态资源上传。地图数据变化时仍需在本机执行 `npm run upload:cloudflare` 或 `--resume`。

官方 Git 集成说明：<https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/index.html>。

## 4. 或部署到 Cloudflare Pages

```bash
npm run build:cloud
npx wrangler pages deploy ets2-map/dist-cloud --project-name ets2-map-toolkit --branch main
```

构建会把 `pages/[[path]].js` 放到 `dist-cloud/functions/`。根配置声明了 `pages_build_output_dir`、`MAP_DATA` R2 绑定和默认 `MAP_VERSION`。

Pages 与 Worker 选择一种作为同一个域名的入口即可。

## 版本与地址

两个根配置中的 `MAP_VERSION` 决定无版本地址使用哪个目录。升级地图时同步修改配置并上传新版本对象；旧版本无需删除。

```text
https://example.com/ets/{z}/{x}/{y}.png
https://example.com/tmp_s1/{z}/{x}/{y}.png
https://example.com/v1.62/ets/{z}/{x}/{y}.png
https://example.com/v1.62/tmp_s1/{z}/{x}/{y}.png
```

Pages 配置参考：<https://developers.cloudflare.com/pages/functions/wrangler-configuration/>。R2 Workers API 参考：<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>。
