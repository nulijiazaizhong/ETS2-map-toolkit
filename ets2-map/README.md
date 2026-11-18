# ETS2 全 DLC 瓦片地图页面

基于本机 Euro Truck Simulator 2 游戏数据生成的互动地图。包含基础地图及 Going East!、Scandinavia、Vive la France!、Italia、Beyond the Baltic Sea、Road to the Black Sea、Iberia、West Balkans、Greece、Nordic Horizons、Iceland，共 12 个地图区域。

- 0–8 级、512 × 512 PNG 瓦片，标准 `ets/{z}/{x}/{y}.png` 和 `tmp_s1/{z}/{x}/{y}.png` 路径。
- 游戏提供的全部语言城市搜索与动态地图标签，语言切换会同步更新城市名和国家名。
- 城市标签使用游戏的城市名称关联节点和各级官方偏移；“显示城市”绘制编辑器中的城市矩形区域。
- DLC 边界由实际扇区与官方陆地遮罩相交生成，保留精细海岸和分离岛屿。
- 官方 `map0–3.dds` 四象限拼接底图，经过道路/陆地配准。
- Leaflet 随项目提供，页面运行时不访问第三方地图或 CDN。

## 数据目录

`public/` 只包含页面。提取数据统一存放在仓库根目录：

```text
data/maps/<游戏版本>/
  ets/
  tmp_s1/
  Overlays/
  Background.png
  Background.json
  Cities.json
  Countries.json
  DlcRegions.json
  DlcSectors.json
  Overlays.json
  TileMapInfo.json
  map-manifest.json
```

`data/maps/active.json` 选择本地默认版本。生成器从游戏程序读取版本，不会把瓦片写入 `public/`；构建会将完整数据复制到服务器产物 `dist/`，云端轻量产物为 `dist-cloud/`。

## 运行

需要 Node.js 18 或更高版本。在仓库根目录执行：

```bash
npm install
npm run dev
```

访问 <http://localhost:8080>。不要直接双击 `index.html`，浏览器会限制通过 `file://` 读取 JSON 数据。也可在 `ets2-map` 目录执行 `npm run dev`，数据仍从仓库版本目录读取。

## 构建与校验

```bash
npm run verify
npm run manifest
npm run build
npm run preview
```

`dist/` 包含完整静态页面、默认瓦片和 `v<大版本>/` 固定版本瓦片，可直接上传到普通静态服务器。`dist-cloud/` 只包含页面和平台函数，供 EdgeOne/Cloudflare 配合对象存储使用。`preview` 直接读取完整 `dist/`。校验覆盖瓦片数量与尺寸、城市和国家数据、多语言、前端资源、版本路由以及每个地图 DLC 的代表城市。

## 插件瓦片源

在 [astrbot-plugin-tmp-bot](https://github.com/BGYdook/astrbot-plugin-tmp-bot) 的 **自定义 ETS2 地图瓦片地址** 中填写：

```text
https://example.com/tmp_s1/{z}/{x}/{y}.png
```

官方全 DLC 地图使用 `/ets/{z}/{x}/{y}.png`。需要固定版本时使用：

```text
https://example.com/v1.62/tmp_s1/{z}/{x}/{y}.png
```

插件要求地址包含 `{z}`、`{x}`、`{y}` 占位符。地图使用项目标准坐标系，不包含插件专用坐标修正。服务器必须允许插件服务器通过公网 HTTPS 访问图片。

## 坐标与版本链接

```text
https://example.com/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=tmp_s1&version=v1.62&mp_id=5931334&name=HarsshhEditzz&server=Simulation%201
```

必需参数为 `x` 和 `y`。`version` 固定地图版本；省略时使用服务端 `MAP_VERSION`。`heading` 显示朝向线，`tiles` 可设为 `tmp_s1` 或默认的 `ets`，`mp_id`、`name`、`server` 用于位置标签。

## 重新生成与部署

提取命令见仓库根目录 `README.md`。EdgeOne Makers Blob 和 Cloudflare R2 部署分别见 `deploy/edgeone/README.md`、`deploy/cloudflare/README.md`。

地图数据版权归 SCS Software 所有，仅供已拥有相应游戏及 DLC 的用户使用。公开部署前请确认你拥有相关内容的再分发权限。本项目与 SCS Software、TruckersMP 无隶属关系。
