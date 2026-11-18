# ETS2 Map Toolkit

从本机 Euro Truck Simulator 2 和 TruckersMP MOD 生成可部署的瓦片地图及互动浏览页面。包含全部官方地图 DLC、游戏官方陆地底图、多语言城市名、精细 DLC 边界、城市区域和坐标分享链接。

## 仓库结构

```text
data/maps/
  active.json             本地默认地图版本（提交到 Git）
  <游戏版本>/             该版本的瓦片、底图和元数据（随仓库提供）
ets2-map/
  public/                 轻量静态页面，不含提取数据
  scripts/                本地服务、校验、清单和构建脚本
  dist/                   完整服务器静态产物，包含默认和版本化瓦片
  dist-cloud/             轻量云端产物，瓦片由 Blob/R2 提供
shared/map-data.js        各运行时共用的路由、版本和响应规则
deploy/
  edgeone/                EdgeOne Makers Functions 与 Blob 上传脚本
  cloudflare/             Cloudflare Pages Functions 与 Worker
edgeone.json              EdgeOne Makers 根目录识别配置
wrangler.toml             Cloudflare Pages 根目录识别配置
wrangler.worker.toml      Cloudflare Worker 根目录识别配置
tools/
  exporter/               TsMap 命令行导出器
  patches/                对 TsMap 的元数据导出补丁
  ts-map/                 TsMap 子模块，固定到 ae8b4c0
  scs_extractor.exe       SCS 解包工具
  rebuild-all.sh          一键重建、校验与部署构建
  rebuild-map.sh          官方 ETS2 地图
  rebuild-tmp-map.sh      TruckersMP Simulation 1 地图
work/                     本地解包和临时文件，不提交到 Git
```

生成器从 `eurotrucks2.exe` 读取游戏版本，将数据写入 `data/maps/<版本>/`，并更新 `active.json`。例如 `v1.62/ets/6/12/7.png`。可用 `ETS2_VERSION=x.y.z` 显式覆盖版本检测。旧版本目录不会被新版本覆盖。

## 克隆

```bash
git clone --recursive https://github.com/nulijiazaizhong/ETS2-map-toolkit.git
cd ETS2-map-toolkit
```

仓库包含完整地图数据，克隆需要下载数百 MB。只需要当前版本时可在 `git clone` 命令中加入 `--depth 1` 减少历史数据下载。如果克隆时忘记 `--recursive`，一键脚本也会自动初始化子模块。

## 准备环境

仅在重新提取和生成地图时需要：

- Windows、Git Bash 和 Git
- 已安装的 ETS2 及需要生成的地图 DLC
- .NET Framework 4.7.2 开发组件
- Node.js 18+
- Python 3，以及 Pillow、NumPy、SciPy、OpenCV：

```bash
python -m pip install pillow numpy scipy opencv-python
```

浏览和部署页面不需要游戏、.NET 或 Python。

## 一键提取和构建

```bash
bash tools/rebuild-all.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

脚本会初始化 TsMap、解包基础资源和全部地图 DLC、生成 `/ets` 瓦片，并在 MOD 目录存在时生成 `/tmp_s1` 瓦片。随后拼接官方底图、生成精细 DLC 边界、校验数据、写入版本清单，并构建完整 `dist/` 与轻量 `dist-cloud/`。原始游戏及 MOD 文件不会被修改。

单独生成：

```bash
bash tools/rebuild-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" 8
bash tools/rebuild-tmp-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:8080`。开发服务同时提供 `ets2-map/public/` 和当前版本数据。`npm run build && npm run preview` 会直接预览完整 `dist/`，包含默认路径和固定版本路径的全部瓦片。

```bash
npm run verify
npm run manifest
npm run build
```

## 瓦片地址与版本

无版本地址使用服务端配置的 `MAP_VERSION`，保持原有插件配置兼容：

```text
https://example.com/ets/{z}/{x}/{y}.png
https://example.com/tmp_s1/{z}/{x}/{y}.png
```

需要固定游戏版本时：

```text
https://example.com/v1.62/ets/{z}/{x}/{y}.png
https://example.com/v1.62/tmp_s1/{z}/{x}/{y}.png
```

互动页面可通过 `?version=v1.62` 固定版本。坐标分享链接示例：

```text
https://example.com/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=tmp_s1&version=v1.62
```

## 部署总览

| 方式 | 页面位置 | 地图数据位置 | 适用场景 |
| --- | --- | --- | --- |
| 普通服务器 | `ets2-map/dist/` | 已包含在 `dist/` 和 `data/maps/<版本>/` | 已有 VPS、Nginx 和域名 |
| EdgeOne Makers | `ets2-map/dist-cloud/` 与 Functions | Makers Blob | 希望使用 EdgeOne 加速和对象存储 |
| Cloudflare Pages | `ets2-map/dist-cloud/` 与 Functions | Cloudflare R2 | 希望使用 Pages，少量服务端代码 |
| Cloudflare Worker | `ets2-map/dist-cloud/` 与 Worker | Cloudflare R2 | 希望统一由 Worker 控制请求 |

仓库包含当前版本的完整地图数据。普通服务器可直接部署完整的 `ets2-map/dist/`，无需再复制瓦片；EdgeOne 和 Cloudflare 使用轻量 `ets2-map/dist-cloud/`，仍需将数据分别上传到 Blob 或 R2。

以下示例均使用：

- 域名：`map.yean.team`，请替换为自己的域名。
- 当前版本：`v1.62`。
- 插件瓦片地址：`https://map.yean.team/v1.62/tmp_s1/{z}/{x}/{y}.png`。

---

## 方式一：普通服务器 + Nginx

适用于 Ubuntu、Debian 等 Linux 服务器。项目自带的 Node 服务会同时提供静态页面和版本化地图数据，Nginx 只负责反向代理和 HTTPS，不需要编写复杂的瓦片路径映射。

### 1. 准备服务器

安装 Node.js 18 或更高版本、Git、Nginx，并确认版本：

```bash
node --version
npm --version
git --version
nginx -v
```

将域名 `map.yean.team` 的 A 或 AAAA 记录指向服务器。防火墙和云安全组只需对外开放 80、443 端口；Node 服务使用的 8080 端口不应暴露到公网。

### 2. 获取项目和地图数据

在服务器上执行：

```bash
sudo mkdir -p /srv/ets2-map-toolkit
sudo chown -R "$USER":"$USER" /srv/ets2-map-toolkit
git clone --recursive https://github.com/nulijiazaizhong/ETS2-map-toolkit.git /srv/ets2-map-toolkit
cd /srv/ets2-map-toolkit
npm ci
npm run build
```

仓库已经包含 `v1.62` 地图数据。如果使用的是本机新生成但尚未提交到仓库的版本，可额外同步整个目录：

```bash
rsync -av --progress data/maps/ user@server:/srv/ets2-map-toolkit/data/maps/
```

将 `user@server` 替换为实际 SSH 用户和地址。克隆或同步后至少应存在：

```text
/srv/ets2-map-toolkit/data/maps/active.json
/srv/ets2-map-toolkit/data/maps/v1.62/TileMapInfo.json
/srv/ets2-map-toolkit/data/maps/v1.62/ets/6/12/7.png
/srv/ets2-map-toolkit/data/maps/v1.62/tmp_s1/6/12/7.png
```

服务器上的 `active.json` 应包含：

```json
{
  "version": "v1.62"
}
```

完整构建会把当前版本数据复制到 `dist/` 根目录和 `dist/v1.62/`，使无版本与固定版本地址都能直接用于静态托管；因此 `dist/` 需要约两倍地图数据的磁盘空间。如果数据已经生成但缺少清单，可执行 `npm run manifest`。然后运行完整校验和构建：

```bash
cd /srv/ets2-map-toolkit
npm run verify
npm run build
```

### 3. 先验证 Node 服务

```bash
MAP_VERSION=v1.62 PORT=8080 npm run preview
```

另开一个终端检查：

```bash
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/v1.62/tmp_s1/6/12/7.png
curl http://127.0.0.1:8080/v1.62/map-manifest.json
```

瓦片响应应为 `200 OK`、`Content-Type: image/png`，并包含 `X-Map-Version: v1.62`。验证期间保持服务运行，下一步将它交给 systemd 管理。

### 4. 配置 systemd 常驻运行

创建 `/etc/systemd/system/ets2-map.service`：

```ini
[Unit]
Description=ETS2 Map Toolkit
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/srv/ets2-map-toolkit
Environment=NODE_ENV=production
Environment=MAP_VERSION=v1.62
Environment=PORT=8080
ExecStart=/usr/bin/node /srv/ets2-map-toolkit/ets2-map/scripts/serve.mjs --dist
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

如果 `command -v node` 的结果不是 `/usr/bin/node`，修改 `ExecStart` 为实际路径。然后启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ets2-map
sudo systemctl status ets2-map
journalctl -u ets2-map -n 100 --no-pager
```

### 5. 配置 Nginx 和 HTTPS

创建 `/etc/nginx/sites-available/ets2-map`：

```nginx
server {
    listen 80;
    server_name map.yean.team;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/ets2-map /etc/nginx/sites-enabled/ets2-map
sudo nginx -t
sudo systemctl reload nginx
```

如果软链接已存在，不要重复创建。DNS 生效后，可使用 Certbot 自动签发证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d map.yean.team
sudo certbot renew --dry-run
```

最后验证公网：

```bash
curl -I https://map.yean.team/v1.62/tmp_s1/6/12/7.png
```

网页地址为 `https://map.yean.team/?version=v1.62&tiles=tmp_s1`。

### 6. 服务器更新流程

更新代码：

```bash
cd /srv/ets2-map-toolkit
git pull --recurse-submodules
npm ci
npm run build
sudo systemctl restart ets2-map
```

发布新大版本时，先上传新的 `data/maps/v<大版本>/`，再修改 `active.json` 和 systemd 中的 `MAP_VERSION`，然后执行：

```bash
npm run verify
sudo systemctl daemon-reload
sudo systemctl restart ets2-map
```

显式版本地址仍可访问旧目录。无版本地址会在重启后使用新版本。

---

## 方式二：EdgeOne Makers + Blob

此方式把静态页面和 Functions 部署到 Makers，把约 17 万个地图文件上传到 Blob。函数根据 URL 中的版本读取对象，因此不会触及静态部署的瓦片文件数量限制。

Blob SDK 文档：<https://makers.edgeone.link/document/blob-storage>。

### 1. 在本机准备数据

```bash
npm ci
npm run verify
npm run manifest
npm run build
```

确认本机存在 `data/maps/v1.62/map-manifest.json`。如果改变了默认版本，可设置 `MAP_VERSION`，上传脚本会以该环境变量为准。

### 2. 创建 Makers 项目和 Blob 上传凭证

在 EdgeOne Makers 控制台创建项目，取得：

- 项目 ID，形式通常类似 `pages-xxxxxxxx`。
- 可访问该项目的 API Token。

不要把 Token 写入 `package.json`、README、函数代码或 Git。以下命令只在本机当前 Git Bash 终端设置环境变量：

```bash
export EDGEONE_PROJECT_ID="pages-xxxxxxxx"
export EDGEONE_API_TOKEN="替换为真实 Token"
export EDGEONE_BLOB_STORE="ets2-map"
export MAP_VERSION="v1.62"
```

`EDGEONE_BLOB_STORE` 可省略，默认就是 `ets2-map`。

### 3. 上传地图到 Blob

```bash
npm run upload:edgeone
```

脚本使用 8 路并发，每 500 个对象输出一次进度。全量上传耗时取决于网络，请保持终端运行。对象键必须保持以下结构：

```text
v1.62/ets/6/12/7.png
v1.62/tmp_s1/6/12/7.png
v1.62/Cities.json
v1.62/Background.png
v1.62/map-manifest.json
```

不要上传成 `data/maps/v1.62/...`，否则函数会返回 404。重复上传同一版本会覆盖同名对象，但不会删除旧版本；当前脚本也不会跳过已存在对象。

### 4. 部署 Makers 项目

推荐使用 Git 集成导入仓库根目录。根目录 `edgeone.json` 已声明：

```text
安装命令：npm install
构建命令：npm run build
输出目录：./ets2-map/dist-cloud
Node 版本：22.11.0
```

构建过程会将 `deploy/edgeone/cloud-functions/` 复制到平台识别的根目录 `cloud-functions/`，同时复制到 `dist-cloud/cloud-functions/` 供直接上传使用。

在 Makers 项目环境变量中设置：

```text
MAP_VERSION=v1.62
EDGEONE_BLOB_STORE=ets2-map
```

Makers Functions 运行时不需要 `EDGEONE_PROJECT_ID` 和 `EDGEONE_API_TOKEN`，SDK 会自动关联当前项目。上传 Token 只应保存在本机。

也可以不使用 Git 集成，直接在 Makers 控制台上传构建后的 `ets2-map/dist-cloud/`。其中已包含静态页面、`edgeone.json` 和 Functions，但 Blob 数据仍需按上一步单独上传。

### 5. 绑定域名并验证

在 Makers 控制台为项目添加 `map.yean.team`，按照控制台给出的记录值配置 DNS CNAME，并等待证书生效。然后检查：

```bash
curl -I https://map.yean.team/v1.62/tmp_s1/6/12/7.png
curl https://map.yean.team/v1.62/map-manifest.json
```

Blob 默认采用最终一致读取，刚上传的对象可能需要短暂等待。更多参数见 `deploy/edgeone/README.md`。

### 6. Makers 版本更新

以 `v1.63` 为例：

```bash
export MAP_VERSION="v1.63"
npm run upload:edgeone
```

上传完成后，在 Makers 环境变量中把 `MAP_VERSION` 改为 `v1.63` 并重新部署。这样无版本地址切换到新地图，而 `/v1.62/...` 和 `/v1.63/...` 都可以独立访问。

---

## 方式三：Cloudflare R2 + Pages 或 Worker

Pages 和 Worker 共用 R2 数据格式，但部署入口不同。**选择其中一种即可**，不必把同一个域名同时绑定到两个项目。

Cloudflare 文档：

- Pages 配置：<https://developers.cloudflare.com/pages/functions/wrangler-configuration/>
- R2 Workers API：<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>

### 1. 登录并创建 R2 桶

```bash
npm ci
npm run verify
npm run manifest
npm run build
npx wrangler login
npx wrangler r2 bucket create ets2-map
```

如果使用其他桶名，同时修改根目录 `wrangler.toml` 和 `wrangler.worker.toml` 中的 `bucket_name`。两个文件中的绑定名 `MAP_DATA` 不要修改，函数通过它访问桶。

### 2. 批量上传 R2 对象

单文件可用 Wrangler：

```bash
npx wrangler r2 object put ets2-map/v1.62/tmp_s1/6/12/7.png --file data/maps/v1.62/tmp_s1/6/12/7.png --remote
```

全量地图不应逐个启动 Wrangler。推荐使用支持 S3 的 `rclone`：

1. 在 Cloudflare R2 控制台创建具有目标桶读写权限的 API Token，并取得 Access Key ID、Secret Access Key 和账户 ID。
2. 执行 `rclone config`，新建名为 `ets2-r2` 的远程存储。
3. 存储类型选择 `s3`，服务商选择 `Cloudflare`，填写上述密钥。
4. Endpoint 填写 `https://<账户ID>.r2.cloudflarestorage.com`，不要附加桶名。

然后在本机仓库根目录执行：

```bash
rclone copy data/maps/v1.62 ets2-r2:ets2-map/v1.62 --transfers=16 --checkers=32 --progress
rclone check data/maps/v1.62 ets2-r2:ets2-map/v1.62
```

`rclone copy` 会把源目录中的内容复制到目标前缀，因此目标中的 `v1.62` 不能省略。最终键必须是 `v1.62/tmp_s1/6/12/7.png`，不能包含 `data/maps/`。密钥只放在 rclone 的本地配置中，不要提交到 Git。

### 3A. 部署到 Cloudflare Pages

根目录 `wrangler.toml` 已包含：

```text
pages_build_output_dir = ./ets2-map/dist-cloud
MAP_VERSION = v1.62
MAP_DATA -> ets2-map R2 桶
```

直接部署：

```bash
npm run build
npx wrangler pages deploy ets2-map/dist-cloud --project-name ets2-map-toolkit --branch main
```

首次执行时按 Wrangler 提示创建或选择 Pages 项目。构建会把 `deploy/cloudflare/pages/[[path]].js` 复制为 `dist-cloud/functions/[[path]].js`，由它处理地图请求，其余请求交给静态页面。

也可以使用 Cloudflare Git 集成，仓库根目录保持不变，构建命令填写 `npm run build`，输出目录填写 `ets2-map/dist-cloud`。使用根目录 Wrangler 配置后，应以该文件作为 Pages 配置的来源；修改绑定时同步修改并提交 `wrangler.toml`。

### 3B. 或部署到 Cloudflare Worker

```bash
npm run build
npx wrangler deploy --config wrangler.worker.toml
```

根目录 `wrangler.worker.toml` 使用 `deploy/cloudflare/worker.js` 作为入口，并把 `ets2-map/dist-cloud` 绑定为 `ASSETS`。Worker 只把有效地图路径发送到 R2，其他路径由静态资源处理。

### 4. 绑定 Cloudflare 自定义域名

在 Pages 或 Worker 的自定义域名设置中添加 `map.yean.team`。如果域名 DNS 已托管在 Cloudflare，通常可直接完成绑定；否则按控制台提示添加 CNAME。完成后验证：

```bash
curl -I https://map.yean.team/v1.62/tmp_s1/6/12/7.png
curl -I https://map.yean.team/tmp_s1/6/12/7.png
```

第一个地址固定读取 `v1.62`，第二个地址读取 Wrangler 配置中的 `MAP_VERSION`。

### 5. Cloudflare 版本更新

上传新目录，例如：

```bash
rclone copy data/maps/v1.63 ets2-r2:ets2-map/v1.63 --transfers=16 --checkers=32 --progress
```

然后将 `wrangler.toml`、`wrangler.worker.toml` 中的 `MAP_VERSION` 改为 `v1.63`，重新部署使用的平台。旧版本对象无需删除。

---

## 部署后验收

将域名替换为实际地址，依次检查：

```bash
# 页面
curl -I https://map.yean.team/

# 固定版本元数据
curl https://map.yean.team/v1.62/TileMapInfo.json
curl https://map.yean.team/v1.62/map-manifest.json

# 固定版本瓦片
curl -I https://map.yean.team/v1.62/tmp_s1/6/12/7.png

# 默认版本瓦片
curl -I https://map.yean.team/tmp_s1/6/12/7.png
```

浏览器打开：

```text
https://map.yean.team/?version=v1.62&tiles=tmp_s1
```

Astrbot 插件的“自定义 ETS2 地图瓦片地址”填写：

```text
https://map.yean.team/v1.62/tmp_s1/{z}/{x}/{y}.png
```

占位符必须是 `{z}`、`{x}`、`{y}`，不要误写成 `{x]`。插件服务器必须能通过公网 HTTPS 读取 PNG。

## 常见问题

### 页面能打开，但城市列表为空或所有请求都是 404

只部署了页面，没有部署数据。普通服务器检查 `data/maps/v1.62/`；EdgeOne 检查 Blob；Cloudflare 检查 R2。城市元数据也必须上传，不能只上传瓦片目录。

### 瓦片 404

确认对象键或服务器路径没有多出的 `data/maps/` 前缀，并核对版本、地图源和坐标，例如：

```text
v1.62/tmp_s1/6/12/7.png
```

响应头 `X-Map-Version` 可用于确认实际命中的版本。请求不存在的大版本返回 404 是预期行为。

### 无版本地址与固定版本地址内容不同

无版本地址由 `MAP_VERSION` 决定。普通服务器检查 systemd 环境变量，Makers 检查项目环境变量，Cloudflare 检查两个 Wrangler 配置并重新部署。

### Cloudflare 报绑定错误

确认 R2 桶已经创建，Wrangler 配置中的 `bucket_name` 正确，绑定名保持 `MAP_DATA`。Pages 使用 `wrangler.toml`，独立 Worker 使用 `wrangler.worker.toml`。

### EdgeOne 函数报存储错误

确认 Blob 命名空间与 `EDGEONE_BLOB_STORE` 一致，并已经向同一 Makers 项目上传对象。运行时无需本机上传 Token；本机上传时才需要项目 ID 和 API Token。

### 更新同一大版本后仍看到旧图片

瓦片响应缓存时间为 24 小时。相同 `v1.62` 路径被覆盖后，客户端或边缘节点可能暂时保留旧内容；可等待缓存到期或清理平台缓存。不同大版本使用不同 URL，不受旧版本缓存影响。

## 数据与版权

`dist/` 是包含全部瓦片的完整服务器产物；`dist-cloud/` 只包含静态页面、共享路由代码和平台函数，避免云端平台的文件数量与大小限制。地图数据版权归 SCS Software 所有。公开部署前请确认拥有相关游戏内容的再分发权限，并根据访问量自行评估对象存储、函数调用和流量费用。

## 外部项目

- [TsMap](https://github.com/dariowouters/ts-map) 以 Git 子模块固定在 `ae8b4c0e77c7af74ca5e76eef84d06e2864732eb`。仓库仅通过 `tools/patches/ts-map-export-metadata.patch` 补充城市区域、名称锚点和 DLC 扇区导出。
- [Leaflet](https://leafletjs.com/) 1.9.4 随静态站点提供，许可证位于 `ets2-map/public/vendor/LEAFLET-LICENSE.txt`。

本项目与 SCS Software、TruckersMP 无隶属关系。

## 开源许可

本项目代码采用 [MIT License](LICENSE)。TsMap 使用 MIT 许可，Leaflet 使用 BSD-2-Clause 许可，具体以各自许可证为准。游戏资源、地图数据及生成图片不属于本项目 MIT 许可的授权范围。
