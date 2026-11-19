# ETS2 / ATS 瓦片地图页面

基于本机 Euro Truck Simulator 2 和 American Truck Simulator 游戏数据生成的互动地图。

- 0–8 级、512 × 512 PNG 瓦片，严格按照版本、游戏和地图类型组织。
- 使用从游戏 `material/ui/loading/logo.dds` 提取的官方图标进行 ETS2 / ATS 游戏选择，以及各自的原版、TruckersMP、ProMods 和 TMP ProMods 底图切换；切换时完整重新加载城市、国家、区域导航、底图和坐标信息。
- ATS 官方 `map0–3.dds` 拼接底图与道路配准，以及按实际 DLC 扇区生成的海岸和区域边界。
- 游戏提供的全部语言城市搜索与动态地图标签，语言切换会同步更新城市名和国家名。
- 城市标签使用游戏的城市名称关联节点和各级官方偏移；“显示城市”绘制编辑器中的城市矩形区域。
- DLC 边界由实际扇区与官方陆地遮罩相交生成，保留精细海岸和分离岛屿。
- 官方 `map0–3.dds` 四象限拼接底图，经过道路/陆地配准。
- Leaflet 随项目提供，页面运行时不访问第三方地图或 CDN。

## 数据目录

`public/` 只包含页面。所有地图数据统一采用以下结构：

```text
data/maps/1.62/
  ATS/
    American/
    TMP/
    American_Promods/
    TMP_Promods/
    metadata/
      American/
      TMP/
      American_Promods/
      TMP_Promods/
  ETS2/
    Europe/
    TMP/
    Europe_Promods/
    TMP_Promods/
    metadata/
      Europe/
      TMP/
      Europe_Promods/
      TMP_Promods/
    map-manifest.json
```

`data/maps/active.json` 选择本地默认版本。生成器从游戏程序读取大版本，不会把瓦片写入 `public/`。构建会将完整数据复制到服务器产物 `dist/1.62/`，云端轻量产物为 `dist-cloud/`。

## 运行

需要 Node.js 22 或更高版本。在仓库根目录执行：

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

`dist/` 只保留完整的版本化结构，不包含旧名称或重复元数据。页面通过 `map-config.js` 自动使用版本路径。`dist-cloud/` 只包含页面和平台函数，供 EdgeOne/Cloudflare 配合对象存储使用。`preview` 直接读取完整 `dist/`。校验覆盖瓦片数量与尺寸、城市和国家数据、多语言、前端资源、版本路由以及每个地图 DLC 的代表城市。

## 插件瓦片源

在 [astrbot-plugin-tmp-bot](https://github.com/BGYdook/astrbot-plugin-tmp-bot) 的 **自定义 ETS2 地图瓦片地址** 中填写：

```text
https://example.com/1.62/ETS2/TMP/{z}/{x}/{y}.png
```

官方 ETS2 全 DLC 地图使用：

```text
https://example.com/1.62/ETS2/Europe/{z}/{x}/{y}.png
```

ATS 官方地图使用：

```text
https://example.com/1.62/ATS/American/{z}/{x}/{y}.png
```

插件要求地址包含 `{z}`、`{x}`、`{y}` 占位符。地图使用项目标准坐标系，不包含插件专用坐标修正。服务器必须允许插件服务器通过公网 HTTPS 访问图片。

## 坐标与版本链接

```text
https://example.com/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=TMP&version=1.62&mp_id=5931334&name=HarsshhEditzz&server=Simulation%201
```

必需参数为 `x` 和 `y`。`version` 固定地图版本，`tiles` 可设为 `Europe`、`TMP`、`Europe_Promods` 或 `TMP_Promods`，`mp_id`、`name`、`server` 用于位置标签。底图选择器会将所选分类同步到 `tiles` 参数，清单中不存在的分类不可选择。

## 重新生成与部署

提取命令见仓库根目录 `README.md`。EdgeOne Makers Blob 和 Cloudflare R2 部署分别见 `deploy/edgeone/README.md`、`deploy/cloudflare/README.md`。

地图数据版权归 SCS Software 所有，仅供已拥有相应游戏及 DLC 的用户使用。公开部署前请确认你拥有相关内容的再分发权限。本项目与 SCS Software、TruckersMP 无隶属关系。
