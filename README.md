# ETS2 / ATS Map Toolkit

从本机 Euro Truck Simulator 2、American Truck Simulator 和 TruckersMP MOD 生成可部署的瓦片地图及互动浏览页面。包含全部官方地图 DLC、多语言城市名、精细 DLC 边界、城市区域和坐标分享链接。

## 仓库结构

```text
data/maps/
  active.json             本地默认地图版本（提交到 Git）
  1.62/
    ATS/
      American/
      TMP/
      American_Promods/
      TMP_Promods/
      metadata/
    ETS2/
      Europe/
      TMP/
      Europe_Promods/
      TMP_Promods/
      metadata/
ets2-map/
  public/                 轻量静态页面，不含提取数据
  scripts/                本地服务、校验、清单和构建脚本
  dist/                   轻量服务器静态产物，瓦片需手动复制
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
  rebuild-ats-maps.sh     ATS 官方、TMP、ProMods 和 TMP ProMods 地图
work/                     本地解包和临时文件，不提交到 Git
```

生成器从游戏程序读取大版本，将数据写入 `data/maps/<版本>/<游戏>/`，并更新 `active.json`。例如 `1.62/ETS2/Europe/6/12/7.png`。可用 `ETS2_VERSION=x.y.z` 显式覆盖版本检测。旧版本目录不会被新版本覆盖。

## 克隆

```bash
git clone --recursive https://github.com/nulijiazaizhong/ETS2-map-toolkit.git
cd ETS2-map-toolkit
```

仓库包含完整地图数据，克隆需要下载数百 MB。只需要当前版本时可在 `git clone` 命令中加入 `--depth 1` 减少历史数据下载。如果克隆时忘记 `--recursive`，一键脚本也会自动初始化子模块。

## 准备环境

仅在重新提取和生成地图时需要：

- Windows、Git Bash 和 Git
- 已安装的 ETS2 / ATS 及需要生成的地图 DLC
- .NET Framework 4.7.2 开发组件
- Node.js 22+（Wrangler 要求；Makers 使用 22.11.0）
- Python 3，以及 Pillow、NumPy、SciPy、OpenCV：

```bash
python -m pip install pillow numpy scipy opencv-python
```

浏览和部署页面不需要游戏、.NET 或 Python。

## 一键提取和构建

```bash
bash tools/rebuild-all.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

脚本会初始化 TsMap、解包基础资源和全部地图 DLC、生成 `ETS2/Europe` 瓦片，并在 MOD 目录存在时生成 `ETS2/TMP` 瓦片。随后拼接官方底图、生成精细 DLC 边界、校验数据、写入版本清单，并构建不含地图数据的 `dist/` 与 `dist-cloud/`。原始游戏及 MOD 文件不会被修改。

单独生成：

```bash
bash tools/rebuild-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" 8
bash tools/rebuild-tmp-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

## ATS 四套地图提取

```bash
bash tools/rebuild-ats-maps.sh "F:/Game/steam/steamapps/common/American Truck Simulator" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ats/mods" "E:/文档/American Truck Simulator/mod" 8
```

脚本使用 `scs_extractor.exe` 解包基础地图和全部官方地图 DLC，并使用 TsMap 分别生成：

| 路径 | 数据内容 |
| --- | --- |
| `ATS/American/` | ATS 官方全部地图 DLC |
| `ATS/TMP/` | 官方地图 + TruckersMP ATS MOD |
| `ATS/American_Promods/` | 官方地图 + 原版 ProMods |
| `ATS/TMP_Promods/` | 官方地图 + ProMods + TruckersMP ATS MOD |

数据按 ATS 大版本保存到 `data/maps/<版本>/ATS/`。四套数据均为 0–8 级、512×512 PNG，每套 87,381 张；城市、国家、覆盖物和地图边界分别保存在 `metadata/<瓦片源>/`。第四参数是最大缩放级别，默认为 8；可用 `ATS_VERSION=x.y.z` 覆盖版本检测。

ETS2 与 ATS 导出器均直接生成 RGBA 透明瓦片，不再填充蓝色背景。道路抗锯齿和渡轮航线的半透明效果会保留，可直接与页面背景叠加。已有旧瓦片不会被自动修改，需要重新运行对应导出脚本才能替换为透明版本。

脚本还会根据官方 `map0–3.dds` 和实际 DLC 扇区生成海岸与区域边界，这些参考图仅用于内部数据生成，不在前端叠加显示。前端提供带官方图标的 ETS2 / ATS 游戏切换，并分别支持原版、TruckersMP、ProMods 和 TMP ProMods 的城市搜索、多语言、区域导航和 DLC 边界框选。`tools/prepare_game_icons.py` 从两款游戏的 `material/ui/loading/logo.dds` 提取带透明通道的官方图标。

脚本结束后自动执行 `ets2-map/scripts/verify-ats.mjs`，检查瓦片数量与尺寸、城市/国家/多语言数据和 ProMods 渲染差异。原始游戏、TruckersMP 和 ProMods 文件不会被修改。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:8080`。开发服务同时提供 `ets2-map/public/` 和当前版本数据，不需要执行构建。

`npm run build` 只生成页面和 `map-config.js`，不会复制任何瓦片或元数据。预览服务器产物前，必须在构建完成后手动将 `data/maps/1.62/` 复制到 `ets2-map/dist/1.62/`。每次构建都会重新创建 `dist/`，因此重新构建后也要再次复制地图数据。

Git Bash：

```bash
npm run build
mkdir -p ets2-map/dist/1.62
cp -R data/maps/1.62/. ets2-map/dist/1.62/
npm run preview
```

PowerShell：

```powershell
npm run build
Copy-Item -Recurse -Force data\maps\1.62 ets2-map\dist\
npm run preview
```

页面通过自动生成的 `map-config.js` 使用 `1.62/` 版本路径。数据校验和清单生成可单独执行：

```bash
npm run verify
npm run manifest
```

## 瓦片地址与版本

所有瓦片与元数据请求都必须包含完整的版本、游戏和地图类型路径，不提供旧名称或兼容映射：

```text
https://example.com/1.62/ETS2/Europe/{z}/{x}/{y}.png
https://example.com/1.62/ETS2/TMP/{z}/{x}/{y}.png
https://example.com/1.62/ATS/American/{z}/{x}/{y}.png
https://example.com/1.62/ATS/TMP/{z}/{x}/{y}.png
```

ProMods 使用 `Europe_Promods`、`TMP_Promods` 或 `American_Promods`。互动页面可通过 `?version=1.62` 固定版本。底图选择器对应 `Europe`、`TMP`、`Europe_Promods`、`TMP_Promods` 目录；清单中尚未生成的来源会标记为“暂无数据”并禁止选择。坐标分享链接示例：

```text
https://example.com/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=TMP&version=1.62
```

## 部署总览

| 方式 | 页面位置 | 地图数据位置 | 适用场景 |
| --- | --- | --- | --- |
| 普通服务器 | `ets2-map/dist/` | 构建后从 `data/maps/<版本>/` 手动复制到 `dist/<版本>/` | 已有 VPS、Nginx 和域名 |
| EdgeOne Makers | `ets2-map/dist-cloud/` 与 Functions | Makers Blob | 希望使用 EdgeOne 加速和对象存储 |
| Cloudflare Pages | `ets2-map/dist-cloud/` 与 Functions | Cloudflare R2 | 希望使用 Pages，少量服务端代码 |
| Cloudflare Worker | `ets2-map/dist-cloud/` 与 Worker | Cloudflare R2 | 希望统一由 Worker 控制请求 |

仓库包含当前版本的完整地图数据。普通服务器在构建后需将 `data/maps/<版本>/` 手动复制到 `ets2-map/dist/<版本>/`，再部署整个 `dist/`；EdgeOne 和 Cloudflare 使用轻量 `ets2-map/dist-cloud/`，仍需将数据分别上传到 Blob 或 R2。

以下示例均使用：

- 域名：`map.yean.team`，请替换为自己的域名。
- 当前版本：`1.62`。
- 插件瓦片地址：`https://map.yean.team/1.62/ETS2/TMP/{z}/{x}/{y}.png`。

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
rsync -av --progress data/maps/1.62/ ets2-map/dist/1.62/
```

仓库已经包含 `1.62` 地图数据。如果使用的是本机新生成但尚未提交到仓库的版本，可额外同步整个目录：

```bash
rsync -av --progress data/maps/ user@server:/srv/ets2-map-toolkit/data/maps/
```

将 `user@server` 替换为实际 SSH 用户和地址。克隆或同步后至少应存在：

```text
/srv/ets2-map-toolkit/data/maps/active.json
/srv/ets2-map-toolkit/data/maps/1.62/ETS2/metadata/Europe/TileMapInfo.json
/srv/ets2-map-toolkit/data/maps/1.62/ETS2/Europe/6/12/7.png
/srv/ets2-map-toolkit/data/maps/1.62/ETS2/TMP/6/12/7.png
```

服务器上的 `active.json` 应包含：

```json
{
  "version": "1.62"
}
```

构建只生成页面，不复制任何地图数据。构建完成后，手动将 `data/maps/1.62/` 中的内容复制到 `dist/1.62/`，保留版本、游戏和地图类型目录，不添加旧名称或重复数据。生成的 `map-config.js` 会让页面自动请求版本路径；普通静态托管和插件均应使用 `/1.62/...` 地址。如果数据已经生成但缺少清单，可执行 `npm run manifest`。然后运行校验、构建和手动复制：

```bash
cd /srv/ets2-map-toolkit
npm run verify
npm run build
rsync -av --progress data/maps/1.62/ ets2-map/dist/1.62/
```

每次 `npm run build` 都会重新创建 `dist/`，包括清除此前手动复制的数据；更新页面后必须再次执行复制命令，再启动或重启服务。

### 3. 先验证 Node 服务

```bash
MAP_VERSION=1.62 PORT=8080 npm run preview
```

另开一个终端检查：

```bash
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/1.62/ETS2/TMP/6/12/7.png
curl http://127.0.0.1:8080/1.62/ETS2/map-manifest.json
```

瓦片响应应为 `200 OK`、`Content-Type: image/png`，并包含 `X-Map-Version: 1.62`。验证期间保持服务运行，下一步将它交给 systemd 管理。

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
Environment=MAP_VERSION=1.62
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
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png
```

网页地址为 `https://map.yean.team/?version=1.62&tiles=TMP`。

### 6. 服务器更新流程

更新代码：

```bash
cd /srv/ets2-map-toolkit
git pull --recurse-submodules
npm ci
npm run build
rsync -av --progress data/maps/1.62/ ets2-map/dist/1.62/
sudo systemctl restart ets2-map
```

发布新大版本时，先上传新的 `data/maps/<大版本>/`，再修改 `active.json` 和 systemd 中的 `MAP_VERSION`。以 `1.63` 为例，然后执行：

```bash
npm run verify
npm run build
rsync -av --progress data/maps/1.63/ ets2-map/dist/1.63/
sudo systemctl daemon-reload
sudo systemctl restart ets2-map
```

旧版本目录仍可独立保留和访问；新请求使用对应版本的完整路径。

---

## 方式二：EdgeOne Makers + Blob

优先推荐使用 **Git 集成构建，并在构建时直接把仓库中的地图数据上传到 Blob**。用户不需要在本机安装游戏、提取瓦片或单独上传地图。

```text
导入 Git 项目
  -> npm run build:cloud
  -> 读取仓库 data/maps/1.62/
  -> npm run upload:edgeone
  -> 写入 Makers Blob 并完成部署
```

Blob SDK 文档：<https://makers.edgeone.link/document/blob-storage>。API Token 创建方法：<https://makers.edgeone.link/document/api-token>。

### 1. 导入 Git 项目

在 Makers 控制台选择 **导入 Git 项目**，导入仓库根目录。不要只选择 `ets2-map/` 或 `deploy/edgeone/` 作为根目录。

根目录 `edgeone.json` 已声明：

```text
安装命令：npm install
构建命令：npm run build:cloud
输出目录：./ets2-map/dist-cloud
Node 版本：22.11.0
```

首次导入时可先使用默认构建命令创建项目。项目创建后，在控制台取得项目 ID，并创建具有 Blob 写入权限的 API Token。

### 2. 启用构建时直接上传 Blob

在 Makers 项目的构建环境变量中设置：

```text
EDGEONE_PROJECT_ID=替换为实际项目 ID
EDGEONE_API_TOKEN=替换为实际 API Token
EDGEONE_BLOB_STORE=ets2-map
MAP_VERSION=1.62
```

`EDGEONE_BLOB_STORE` 可省略，默认值为 `ets2-map`。API Token 必须保存在受保护的环境变量中，不要写入 `edgeone.json`、源码或 Git。

根目录 `edgeone.json` 默认使用：

```json
"buildCommand": "npm run build:cloud && npm run upload:edgeone -- --resume"
```

该配置会覆盖控制台中的同名构建设置，应以仓库文件为准。推送代码后，Makers 会自动构建并直接从 Git 仓库读取 `data/maps/1.62/`，再上传到当前项目的 Blob。上传失败会使构建失败，上传成功后才完成部署。

对象键为 `<版本>/<相对路径>`，例如：

```text
1.62/ETS2/Europe/6/12/7.png
1.62/ETS2/TMP/6/12/7.png
1.62/ETS2/metadata/Europe/Cities.json
1.62/ETS2/metadata/Europe/Background.png
1.62/ETS2/map-manifest.json
```

不要添加 `data/maps/` 前缀。上传默认使用 32 路并发，单文件失败会自动重试 3 次。遇到平台限流或网络不稳定时，可通过 `EDGEONE_UPLOAD_CONCURRENCY` 将并发调整为 16 或 8。构建超时后再次运行相同命令，会利用 `--resume` 从已有对象继续。如果凭证无权执行 Blob LIST（403），脚本会记录警告并回退为覆盖式 PUT 上传，不会中止构建。

注意：首次 Git 构建需要上传 17 万余个对象，会显著延长构建时间并增加 API 请求量。后续默认使用 `--resume` 查询清单并只补传缺失对象。只希望更新页面时，可临时恢复 `npm run build:cloud`，避免读取和上传地图。

### 3. 绑定域名并验证

等待构建和 Blob 上传全部完成后，在 Makers 控制台为项目添加 `map.yean.team`，按照控制台给出的记录值配置 DNS CNAME，并等待证书生效。然后检查：

```bash
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png
curl https://map.yean.team/1.62/ETS2/map-manifest.json
```

所有请求均使用 `1.62/...` 这样的完整版本路径。函数使用强一致 Blob 读取，上传完成后即可读取最新对象。更多说明见 `deploy/edgeone/README.md`。

### 4. 备用：本机直接上传与断点续传

本机直接上传适合首次手动初始化、云端构建上传失败后的续传，或不希望每次 Git 构建都全量上传的情况。

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

`--resume` 会列出 Blob 中已有对象，只补传缺失文件。看到 `Progress 175904/175904 objects for 1.62` 才表示当前清单全部处理完成。Token 只从环境变量读取，不要发到聊天或提交到仓库。

### 5. Makers 版本更新

以 `1.63` 为例：

1. 将新地图提交到 `data/maps/1.63/`。
2. 把 Makers 构建环境变量 `MAP_VERSION` 改为 `1.63`。
3. 推送代码，构建过程会自动上传新版本并部署页面。

旧版本对象无需删除，`/1.62/...` 与 `/1.63/...` 可以并存。

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
npm run build:cloud
npx wrangler login
npx wrangler r2 bucket create ets2-map
```

如果使用其他桶名，同时修改根目录 `wrangler.toml` 和 `wrangler.worker.toml` 中的 `bucket_name`。两个文件中的绑定名 `MAP_DATA` 不要修改，函数通过它访问桶。

### 2. Connect GitHub 并在构建时上传 R2（推荐）

优先使用 **Connect GitHub / Workers Builds**，在构建时直接把仓库中的地图数据上传到 R2，无需用户在本机安装游戏或手动上传。

在 Cloudflare 控制台进入 **R2 object storage**，在 **Account Details** 旁选择 **Manage API Tokens**，创建 Account API Token：权限选择 **Object Read & Write**，可将范围限制为 `ets2-map` 桶。创建后取得 **Access Key ID**、**Secret Access Key** 和账户 ID。官方说明：<https://developers.cloudflare.com/r2/api/s3/tokens/>。

进入 **Workers & Pages**，创建或选择 `ets2-map-toolkit` Worker，打开 **Settings > Builds**，在 **Git Repository** 中选择 **Manage**。授权 Cloudflare GitHub 应用，并选择 `nulijiazaizhong/ETS2-map-toolkit` 仓库。

在 Workers Builds 的构建环境变量中设置：

```text
CLOUDFLARE_ACCOUNT_ID=实际账户 ID
CLOUDFLARE_R2_ACCESS_KEY_ID=实际 Access Key ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=实际 Secret Access Key
CLOUDFLARE_R2_BUCKET=ets2-map
MAP_VERSION=1.62
```

密钥必须保存在受保护的环境变量中，不要写入源码、Wrangler 配置或 GitHub。

构建设置如下：

```text
生产分支：main
构建命令：npm run build:cloud && npm run upload:cloudflare -- --resume
部署命令：npx wrangler deploy --config wrangler.worker.toml
根目录：保持仓库根目录
```

每次 GitHub 推送都会构建轻量页面，读取 `data/maps/` 中 `MAP_VERSION` 对应的目录，查询 R2 清单并只上传缺失对象，最后部署 Worker。上传失败会使构建失败。首次上传仍需处理 17 万余个对象；后续 `--resume` 构建只补传缺失文件。对象键为 `<版本>/<相对路径>`，不能包含 `data/maps/` 前缀。

上传默认使用 128 路并发，单文件失败会自动重试 3 次。遇到 R2 限流或网络不稳定时，可通过 `CLOUDFLARE_UPLOAD_CONCURRENCY` 将并发调整为 32、16 或 8。构建超时后再次运行相同命令，会从已有对象继续。

官方 Git 集成说明：<https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/index.html>。

### 3. 备用：本机直接上传或断点续传

本机上传适合首次手动初始化、云端构建上传失败后的恢复，或不希望通过 Git 构建上传的情况。在当前终端设置与上文相同的环境变量，然后执行：

```bash
npm run upload:cloudflare
```

PowerShell 使用 `$env:变量名="值"` 设置环境变量。脚本默认使用 128 路并发，单文件失败会自动重试 3 次。上传中断时执行：

```bash
npm run upload:cloudflare -- --resume
```

`--resume` 使用 R2 对象清单跳过已有文件，只补传缺失对象。看到 `Progress 175904/175904 objects for 1.62` 才表示当前清单全部处理完成。不要将密钥提交到 Git 或发到聊天中。

### 4A. 部署到 Cloudflare Pages

根目录 `wrangler.toml` 已包含：

```text
pages_build_output_dir = ./ets2-map/dist-cloud
MAP_VERSION = 1.62
MAP_DATA -> ets2-map R2 桶
```

直接部署：

```bash
npm run build:cloud
npx wrangler pages deploy ets2-map/dist-cloud --project-name ets2-map-toolkit --branch main
```

首次执行时按 Wrangler 提示创建或选择 Pages 项目。构建会把 `deploy/cloudflare/pages/[[path]].js` 复制为 `dist-cloud/functions/[[path]].js`，由它处理地图请求，其余请求交给静态页面。

也可以使用 Cloudflare Git 集成，仓库根目录保持不变，构建命令填写 `npm run build:cloud`，输出目录填写 `ets2-map/dist-cloud`。使用根目录 Wrangler 配置后，应以该文件作为 Pages 配置的来源；修改绑定时同步修改并提交 `wrangler.toml`。

### 4B. 或部署到 Cloudflare Worker

```bash
npm run build:cloud
npx wrangler deploy --config wrangler.worker.toml
```

根目录 `wrangler.worker.toml` 使用 `deploy/cloudflare/worker.js` 作为入口，并把 `ets2-map/dist-cloud` 绑定为 `ASSETS`。Worker 只把有效地图路径发送到 R2，其他路径由静态资源处理。

Connect GitHub 的构建上传配置见上文推荐流程。此处 CLI 命令用于不经过 Git 集成的手动部署。

### 5. 绑定 Cloudflare 自定义域名

在 Pages 或 Worker 的自定义域名设置中添加 `map.yean.team`。如果域名 DNS 已托管在 Cloudflare，通常可直接完成绑定；否则按控制台提示添加 CNAME。完成后验证：

```bash
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png
```

第一个地址固定读取 `1.62`，第二个地址读取 Wrangler 配置中的 `MAP_VERSION`。

### 6. Cloudflare 版本更新

以 `1.63` 为例，将新地图提交到 `data/maps/1.63/`，把构建环境变量及 `wrangler.toml`、`wrangler.worker.toml` 中的 `MAP_VERSION` 改为 `1.63`，再推送代码。Git 构建会使用 `--resume` 上传新版本对象并部署，旧版本无需删除。

不经过 Git 构建时，也可在本机执行 `MAP_VERSION=1.63 npm run upload:cloudflare`，然后重新部署。

---

## 部署后验收

将域名替换为实际地址，依次检查：

```bash
# 页面
curl -I https://map.yean.team/

# 固定版本元数据
curl https://map.yean.team/1.62/ETS2/metadata/Europe/TileMapInfo.json
curl https://map.yean.team/1.62/ETS2/map-manifest.json

# 固定版本瓦片
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png

# 默认版本瓦片
curl -I https://map.yean.team/1.62/ETS2/TMP/6/12/7.png
```

浏览器打开：

```text
https://map.yean.team/?version=1.62&tiles=TMP
```

Astrbot 插件的“自定义 ETS2 地图瓦片地址”填写：

```text
https://map.yean.team/1.62/ETS2/TMP/{z}/{x}/{y}.png
```

占位符必须是 `{z}`、`{x}`、`{y}`，不要误写成 `{x]`。插件服务器必须能通过公网 HTTPS 读取 PNG。

## 常见问题

### 页面能打开，但城市列表为空或所有请求都是 404

只部署了页面，没有部署数据。普通服务器检查 `ets2-map/dist/1.62/`，源数据应保留在 `data/maps/1.62/`；EdgeOne 检查 Blob；Cloudflare 检查 R2。城市元数据也必须复制或上传，不能只处理瓦片目录。

### 瓦片 404

确认对象键或服务器路径没有多出的 `data/maps/` 前缀，并核对版本、地图源和坐标，例如：

```text
1.62/ETS2/TMP/6/12/7.png
```

响应头 `X-Map-Version` 可用于确认实际命中的版本。请求不存在的大版本返回 404 是预期行为。

### 瓦片路径返回 404

确认 URL 包含版本、游戏和地图类型，例如 `1.62/ETS2/TMP/6/12/7.png`，并核对 Blob/R2 中的对象键是否完全一致。

### Cloudflare 报绑定错误

确认 R2 桶已经创建，Wrangler 配置中的 `bucket_name` 正确，绑定名保持 `MAP_DATA`。Pages 使用 `wrangler.toml`，独立 Worker 使用 `wrangler.worker.toml`。

### EdgeOne 函数报存储错误

确认 Blob 命名空间与 `EDGEONE_BLOB_STORE` 一致，并已经向同一 Makers 项目上传对象。运行时无需本机上传 Token；本机上传时才需要项目 ID 和 API Token。

### 更新同一大版本后仍看到旧图片

页面默认注册 `sw.js`，将成功读取的瓦片写入浏览器 Cache Storage，后续访问优先使用缓存，不缓存 404 或元数据，也不会预下载整套地图。瓦片 URL 的版本参数更新时会使用新的缓存空间，旧缓存自动清理。

瓦片 HTTP 缓存时间为 24 小时。相同 `1.62` 路径被覆盖后，客户端或边缘节点可能暂时保留旧内容；可等待缓存到期或清理平台缓存。不同大版本使用不同 URL，不受旧版本缓存影响。

## 数据与版权

`dist/` 与 `dist-cloud/` 都是不含瓦片的轻量构建产物。普通服务器需在构建后手动复制版本化地图数据到 `dist/<版本>/`；云端产物只包含静态页面、共享路由代码和平台函数，避免云端平台的文件数量与大小限制。地图数据版权归 SCS Software 所有。公开部署前请确认拥有相关游戏内容的再分发权限，并根据访问量自行评估对象存储、函数调用和流量费用。

## 外部项目

- [TsMap](https://github.com/dariowouters/ts-map) 以 Git 子模块固定在 `ae8b4c0e77c7af74ca5e76eef84d06e2864732eb`。仓库仅通过 `tools/patches/ts-map-export-metadata.patch` 补充城市区域、名称锚点和 DLC 扇区导出。
- [Leaflet](https://leafletjs.com/) 1.9.4 随静态站点提供，许可证位于 `ets2-map/public/vendor/LEAFLET-LICENSE.txt`。

本项目与 SCS Software、TruckersMP 无隶属关系。

## 开源许可

本项目代码采用 [MIT License](LICENSE)。TsMap 使用 MIT 许可，Leaflet 使用 BSD-2-Clause 许可，具体以各自许可证为准。游戏资源、地图数据及生成图片不属于本项目 MIT 许可的授权范围。
