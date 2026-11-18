# Cloudflare Pages / Worker

此目录包含 Pages Functions 和独立 Worker，两者都从同一个 R2 桶读取地图数据。根目录 `wrangler.toml` 用于 Pages，`wrangler.worker.toml` 用于 Worker。

## 准备 R2

创建名为 `ets2-map` 的桶，或修改两个 Wrangler 配置中的 `bucket_name`：

```bash
npx wrangler login
npx wrangler r2 bucket create ets2-map
```

将 `data/maps/<版本>/` 内的文件上传到桶，保持 `<版本>/<相对路径>` 的对象键。例如本地 `data/maps/v1.62/tmp_s1/6/12/7.png` 对应：

```text
v1.62/tmp_s1/6/12/7.png
```

单文件可用 Wrangler 上传：

```bash
npx wrangler r2 object put ets2-map/v1.62/tmp_s1/6/12/7.png --file data/maps/v1.62/tmp_s1/6/12/7.png --remote
```

全量地图包含 17 万余个对象，批量上传应使用 R2 的 S3 兼容 API 或支持并发的 S3 工具，不要逐个启动 Wrangler。上传密钥通过环境变量或 S3 工具的配置提供，不要提交到仓库。

## Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy ets2-map/dist-cloud --project-name ets2-map-toolkit
```

构建会把 `pages/[[path]].js` 放到 `dist-cloud/functions/`。根配置声明了 `pages_build_output_dir`、`MAP_DATA` R2 绑定和默认 `MAP_VERSION`。

## Cloudflare Worker

```bash
npm run build
npx wrangler deploy --config wrangler.worker.toml
```

Worker 将数据请求发送到 R2，其余请求交给 `ASSETS`。`dist-cloud/.assetsignore` 会排除 Pages Functions、Makers Functions 和共享服务端代码，避免作为公开静态资源上传。

## 版本与地址

两个根配置中的 `MAP_VERSION` 决定无版本地址使用哪个目录。升级地图时同步修改配置并上传新版本对象；旧版本无需删除。

```text
https://example.com/ets/{z}/{x}/{y}.png
https://example.com/tmp_s1/{z}/{x}/{y}.png
https://example.com/v1.62/ets/{z}/{x}/{y}.png
https://example.com/v1.62/tmp_s1/{z}/{x}/{y}.png
```

Pages 配置参考：<https://developers.cloudflare.com/pages/functions/wrangler-configuration/>。R2 Workers API 参考：<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>。
