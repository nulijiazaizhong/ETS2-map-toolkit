# ETS2 全 DLC 瓦片地图

基于本机 Euro Truck Simulator 2 游戏数据生成的离线互动地图。包含基础地图及 Going East!、Scandinavia、Vive la France!、Italia、Beyond the Baltic Sea、Road to the Black Sea、Iberia、West Balkans、Greece、Nordic Horizons、Iceland，共 12 个地图区域。

- 0–8 级、512 × 512 PNG 瓦片，标准 `ets/{z}/{x}/{y}.png` 目录。
- 道路、路口、地图覆盖物、渡轮、秘密道路及城市数据。
- 游戏提供的全部语言城市搜索与动态地图标签，语言切换会同步更新城市名和国家名。
- 城市标签在 4 级及以上缩放显示，位置使用游戏的城市名称关联节点和各级官方偏移，瓦片本身不固定任何语言。
- “显示城市”会绘制编辑器中的城市矩形区域，圆点位于区域中心；另支持区域跳转和缩放定位。
- “DLC 区域边界”将各 SCS 地图包实际包含的扇区与配准后的官方陆地遮罩相交，生成精细海岸轮廓并保留分离岛屿，可点击框选和缩放。
- “游戏底图”将官方 `map0–3.dds` 四象限拼接后放在道路下方，并通过道路/陆地配准对齐坐标。
- Leaflet 已随项目提供，运行时不访问任何第三方地图或 CDN 服务。

## 运行

需要 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

访问 <http://localhost:8080>。也可在 `ets2-map` 目录执行 `npm start`。不要直接双击 `index.html`，浏览器会限制通过 `file://` 读取 JSON 数据。

## 部署

`public/` 已经是完整静态站点，可直接部署到 Nginx、Apache、IIS、GitHub Pages、Cloudflare Pages 或其他静态网站服务。

需要独立构建目录时：

```bash
npm run build
npm run preview
```

将 `dist/` 全部内容上传到静态服务器即可。部署在子路径时无需修改配置，所有资源均使用相对路径。服务器应为 `.png`、`.json`、`.js` 和 `.css` 配置正确的 MIME 类型，并建议为瓦片开启长期缓存。重新生成瓦片或城市元数据后，应递增 `app.js` 中对应 URL 的 `v` 参数，避免浏览器继续显示旧版本。

## Astrbot TMP 插件瓦片源

将 `dist/` 内的全部内容上传到静态网站的域名根目录后，在 [astrbot-plugin-tmp-bot](https://github.com/BGYdook/astrbot-plugin-tmp-bot) 的 **自定义 ETS2 地图瓦片地址** 中填写：

```text
https://example.com/ets/{z}/{x}/{y}.png
```

把 `example.com` 替换为实际域名。插件要求地址包含 `{z}`、`{x}`、`{y}` 占位符；本项目提供 512×512 PNG 和 0–8 级原生瓦片。地图使用项目标准坐标系，不包含插件专用坐标修正。服务器必须允许插件服务器通过公网 HTTPS 访问这些图片。

### TruckersMP / Simulation 1

项目同时生成包含本地 TruckersMP MOD 的独立瓦片源：

```text
https://example.com/tmp_s1/{z}/{x}/{y}.png
```

默认读取 `C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods` 下的 `.mp`、`.scs`、`.zip` MOD，不会覆盖 `/ets`。重新生成：

```bash
bash tools/rebuild-tmp-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

## 坐标分享链接

可以通过 URL 直接打开指定游戏坐标，无需生成静态图片：

```text
https://map.yean.team/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=tmp_s1&mp_id=5931334&name=HarsshhEditzz&server=Simulation%201
```

必需参数为 `x` 和 `y`。`heading` 显示朝向线，`zoom` 设置缩放级别，`tiles` 可设为 `tmp_s1` 或默认的 `ets`，`mp_id`、`name`、`server` 用于位置标签。名称和服务器包含空格或特殊字符时应进行 URL 编码。

## 校验

```bash
npm run verify
```

校验瓦片数量与尺寸、城市和国家数据、多语言覆盖、本地前端资源，以及每个地图 DLC 的代表城市。

## 从游戏文件重新生成

此步骤只适用于 Windows + Git Bash，且需要本机已安装游戏、.NET Framework 4.7.2 开发组件，以及带有 Pillow、NumPy、SciPy、OpenCV 的 Python。部署和浏览地图不需要游戏或 Python。

在项目上级工作区运行：

```bash
bash tools/rebuild-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" 8
```

脚本使用 `tools/scs_extractor.exe` 解包基础地图和全部地图 DLC，再调用 TsMap 渲染器生成瓦片。原始 `.scs` 文件不会被修改。非地图类涂装、车辆、挂车 DLC 不增加地理区域，因此无需解包。

## 数据与版权

地图数据版权归 SCS Software 所有，仅供已拥有相应游戏及 DLC 的用户使用。公开部署前请确认你拥有相关内容的再分发权限。本项目与 SCS Software 无隶属关系。

渲染器：[TsMap](https://github.com/dariowouters/ts-map)。地图库：[Leaflet](https://leafletjs.com/)（BSD-2-Clause）。
