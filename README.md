# 群星闪耀（简单扩展）

当前版本采用“简单扩展”结构：**不使用 build**，也**不依赖 `src/`、`dist/`、`scripts/`**。

运行时入口：`extension.js`（可直接编辑）。

## 目录结构（以运行时为准）

-   `extension.js` – 无名杀运行时读取的入口文件（直接编辑这里）。
-   `source/` – 模块化逻辑（`basic/content/precontent/config/help`）。
-   `extension.css` – 样式文件（在 `source/precontent.js` 中加载）。
-   `info.json` – 扩展信息。

> 说明：`src/`、`dist/`、`scripts/`、`package.json` 等为旧工程遗留/模板文件，可忽略；不再作为开发入口。

## 开发小贴士

-   入口与逻辑：优先修改 `extension.js` 与 `source/`。
-   路径约定：`extension.js` 里保持 `../../noname.js`；`source/*.js` 里保持 `../../../noname.js`。
