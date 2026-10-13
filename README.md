# Wander AI · 寻游湖北

基于原始 Figma 线框图实现的高保真、响应式旅游网页原型。

## 技术栈

- React 19 + TypeScript
- Tailwind CSS 4（Vite 插件，构建时生成 CSS）
- Vite 8
- Lucide React 图标
- 本地打包的 Manrope 与 Noto Sans SC 字体

## 本地运行

需要 Node.js 22.12+ 或 24+。

```bash
npm ci
npm run dev
```

打开终端输出的本地网址。默认地址为 `http://127.0.0.1:5173/`。

```bash
npm run check
npm run build
npm run preview
```

生产构建位于 `dist/`。该目录可以部署到支持静态文件的网站托管服务。

## GitHub 与 Cloudflare Pages

通过 Cloudflare Pages 的 Git 集成部署此仓库，推送 `main` 后自动构建并发布。

| 设置 | 值 |
| --- | --- |
| 框架预设 | React (Vite) |
| 生产分支 | `main` |
| 根目录 | 仓库根目录（留空） |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| Node.js | `.node-version` 指定的 `24.21.0` |

仓库包含锁文件；Cloudflare 安装项目依赖后执行构建。网页、景点图片和字体均由站点本身提供，无需 API 密钥或后端服务。Cloudflare 的 `pages.dev` 生产网址可公开访问，GitHub 源码仓库可以保持私有。

`wrangler.toml` 记录 Pages 名称与静态构建目录，供已授权的 Wrangler 手动部署使用。账号凭证应保存在 Cloudflare 或本机授权配置中，不要提交到 Git。

## 页面与交互

- 顶部导航、湖北西陵峡实拍 Hero 和旅行搜索区
- 恩施大峡谷、神农架、武汉黄鹤楼三张目的地卡片
- 目的地与人数筛选、分类筛选、浏览器本地收藏
- 景点详情与建议行程弹窗
- 行程灵感选择与建议展示
- 示例旅行者故事、全宽注册引导、页脚与图片鸣谢
- 手机导航、单列卡片、可聚焦表单与键盘友好弹窗

这是高保真交互原型。示例评价不是实际用户评价；行程灵感来自预设建议；注册表单不会创建真实账号或发送邮箱。未接入旅游库存、订单、支付或 AI 接口。

## 主要文件

- `src/App.tsx`：页面组合与交互状态
- `src/components/ui.tsx`：按钮、输入框、选择框、卡片等可复用 React 组件
- `src/components/Modal.tsx`：带 Escape 关闭与焦点管理的弹窗
- `src/data.ts`：湖北目的地、示例故事和图片署名
- `src/styles.css`：Tailwind 主题、颜色与全局样式
- `public/images/`：实际使用的景点照片与原 Figma 品牌图形
- `SOURCES.md`：图片来源、作者与许可

## 已验证

TypeScript 检查与生产构建通过。浏览器检查了桌面整页和手机布局（390px 视口），图片全部正常加载、手机无横向溢出、无浏览器错误。已验证搜索筛选、收藏、行程详情、注册体验、手机菜单和行程灵感交互。

原始线框图：[Figma](https://www.figma.com/design/YDADbdkQCoLAyzgBFPrYG8?node-id=4-31)。高保真版本沿用原页面的功能顺序，按本次需求更换了地域、配图与视觉风格。
