# EdgeOne Makers

此目录包含 Blob 上传脚本和 Makers Node.js Functions。构建时函数会复制到根目录 `cloud-functions/`（Git 集成识别）及 `ets2-map/dist-cloud/cloud-functions/`（直接上传识别），源码仍只保留在这里。

## 1. 上传版本数据

在仓库根目录安装依赖并生成地图，然后设置 Makers 项目 ID 和 API Token：

```bash
npm install
export EDGEONE_PROJECT_ID="pages-xxxxxxxx"
export EDGEONE_API_TOKEN="你的 API Token"
npm run upload:edgeone
```

脚本上传 `active.json` 指向的完整版本目录。也可固定版本：

```bash
MAP_VERSION=v1.62 npm run upload:edgeone
```

默认命名空间为 `ets2-map`，可通过 `EDGEONE_BLOB_STORE` 修改。对象键为 `<版本>/<原始相对路径>`，例如 `v1.62/tmp_s1/6/12/7.png`。同一版本重复上传会覆盖同名对象，不会删除旧版本。17 万余个对象的上传需要较长时间，脚本使用 8 路并发并每 500 个对象报告进度。Token 只从环境变量读取，不要写入仓库。

Blob 使用文档：<https://makers.edgeone.link/document/blob-storage>。

## 2. 部署

根目录 `edgeone.json` 已配置安装命令、构建命令、Node 版本和输出目录。将仓库导入 Makers，在项目环境变量中设置：

```text
MAP_VERSION=v1.62
EDGEONE_BLOB_STORE=ets2-map
```

`EDGEONE_BLOB_STORE` 可省略，默认值为 `ets2-map`。Makers Functions 内不需要项目 ID 或 API Token；平台会自动绑定当前项目的 Blob。

也可以将构建后的 `ets2-map/dist-cloud/` 直接上传，其中已包含 `edgeone.json`、`cloud-functions/` 和静态页面，但不包含瓦片。

部署后以下地址均可读取同一对象：

```text
https://example.com/tmp_s1/6/12/7.png
https://example.com/v1.62/tmp_s1/6/12/7.png
```

切换 `MAP_VERSION` 只影响无版本地址；带 `/v<大版本>/` 的地址始终读取指定版本。Blob 默认最终一致，刚上传的对象可能需要短暂等待。
