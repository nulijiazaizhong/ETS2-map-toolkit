# ETS2 / TruckersMP 瓦片地图项目

从本机 Euro Truck Simulator 2 和 TruckersMP MOD 生成可部署的瓦片地图及互动浏览页面。包含全部官方地图 DLC、游戏官方陆地底图、多语言城市名、精细 DLC 边界、城市区域和坐标分享链接。

## 仓库结构

```text
ets2-map/                 静态站点、校验和构建脚本
  public/                 页面源码；生成资源不会提交到 Git
  scripts/                构建与完整性校验
tools/
  exporter/               TsMap 命令行导出器
  patches/                对 TsMap 的元数据导出补丁
  ts-map/                 TsMap 子模块，固定到 ae8b4c0
  scs_extractor.exe       SCS 解包工具
  rebuild-all.sh          一键重建与部署构建
  rebuild-map.sh          官方 ETS2 地图
  rebuild-tmp-map.sh      TruckersMP Simulation 1 地图
  prepare_background.py   官方底图拼接与坐标配准
  prepare_dlc_regions.py  DLC 精细海岸轮廓
work/                     本地解包和临时文件，不会提交到 Git
```

## 克隆

```bash
git clone --recursive <仓库地址>
cd <仓库目录>
```

如果克隆时忘记 `--recursive`，一键脚本也会自动初始化子模块。

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

浏览和部署生成后的静态站点不需要游戏、.NET 或 Python。

## 一键提取和构建

```bash
bash tools/rebuild-all.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

脚本会：

1. 初始化 TsMap 子模块并恢复 NuGet 包。
2. 使用 `scs_extractor.exe` 解包基础资源、基础地图和全部地图 DLC。
3. 生成 `/ets` 官方全 DLC 瓦片。
4. 如果存在 TruckersMP MOD 目录，生成 `/tmp_s1` 瓦片；不存在则明确跳过。
5. 拼接官方底图、执行道路/陆地配准并生成精细 DLC 边界。
6. 校验两组瓦片及元数据，构建 `ets2-map/dist/`。

解包和全量渲染需要较多磁盘空间和时间。原始游戏及 MOD 文件不会被修改。

## 单独生成

```bash
bash tools/rebuild-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" 8
bash tools/rebuild-tmp-map.sh "F:/Game/steam/steamapps/common/Euro Truck Simulator 2" "C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods"
```

## 本地运行

```bash
cd ets2-map
npm ci
npm run dev
```

访问 `http://localhost:8080`。

## 部署

将 `ets2-map/dist/` 内的全部内容上传到静态网站根目录。无需 Node.js 服务器或后端接口。

```text
https://example.com/ets/{z}/{x}/{y}.png
https://example.com/tmp_s1/{z}/{x}/{y}.png
```

坐标分享链接示例：

```text
https://example.com/?x=-28130&y=-4971&heading=1.94&zoom=6&tiles=tmp_s1&mp_id=5931334&name=HarsshhEditzz&server=Simulation%201
```

更多运行、校验和插件配置说明见 `ets2-map/README.md`。

## 外部项目

- [TsMap](https://github.com/dariowouters/ts-map) 以 Git 子模块固定在 `ae8b4c0e77c7af74ca5e76eef84d06e2864732eb`。仓库仅通过 `tools/patches/ts-map-export-metadata.patch` 补充城市区域、名称锚点和 DLC 扇区导出。
- [Leaflet](https://leafletjs.com/) 1.9.4 随静态站点提供，许可证位于 `ets2-map/public/vendor/LEAFLET-LICENSE.txt`。

地图数据版权归 SCS Software 所有。公开部署前请确认拥有相关游戏内容的再分发权限。本项目与 SCS Software、TruckersMP 无隶属关系。
