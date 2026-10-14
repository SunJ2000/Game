# Linux Nginx 部署

访问地址：`http://sunj2000.com/game/` 或 `http://106.14.136.223/game/`。访问 `/game` 会自动重定向到 `/game/`。

Vite 已配置 `base: '/game/'`。请使用重新构建后的 dist；旧的根路径构建会请求 `/assets/`，无法在当前 Nginx 下正常加载。

## 1. 上传网站文件

在本机项目目录执行：

```bash
npm run build
```

将 `dist/` **里面的内容**上传到服务器 `/opt/game/`，最终结构：

```text
/opt/game/
├── index.html
├── favicon.svg
└── assets/
    ├── index-….js
    └── index-….css
```

不是 `/opt/game/dist/index.html`。Nginx 运行用户需要具有目录读取/遍历及文件读取权限。

## 2. 安装 game.conf

这是一份包含完整 `server` 的独立配置，直接由主配置中的 `include /etc/nginx/conf.d/*.conf;` 加载，**不需要给现有配置添加 include**。

它包含 `/game/`、原有 `/image-view/` 以及 `/api/` 路由，域名仍是 `sunj2000.com` 和 `106.14.136.223`，监听 80 端口。

先把本目录的 `game.conf` 上传到服务器（例如 `/tmp/game.conf`），再执行以下步骤。先备份旧配置，并将其移出 `*.conf` 加载范围，然后安装新文件：

```bash
sudo mkdir -p /etc/nginx/config-backups
sudo mv /etc/nginx/conf.d/image-view.conf /etc/nginx/config-backups/image-view.conf
sudo cp /tmp/game.conf /etc/nginx/conf.d/game.conf
```

配置文件扩展名使用 `.conf`。**旧的 image-view.conf 与新的 game.conf 不要同时启用**：Nginx 先按监听地址/端口与 Host 选择一个 server，再匹配该 server 内的 location，不会将同域名两个 server 的路径自动合并。这份配置通过一个 server 同时承载三个路径。

上述命令适用于首次迁移；后续更新直接覆盖 game.conf 即可。旧配置已留在 config-backups 目录，现有进程在成功 reload 前继续使用已加载的配置。若 `nginx -t` 失败，先根据提示修复，不要 reload。

你提供的原文件只监听 HTTP 80；如果还有独立 HTTPS 443 配置，需要在那份配置里同步添加 game.conf 中的 `/game` 路由。

## 3. 检查并重载

```bash
sudo nginx -t && sudo systemctl reload nginx
```

测试成功后再重载。部署完成后检查：

```bash
curl -I http://sunj2000.com/game
curl -I http://sunj2000.com/game/
curl -I http://sunj2000.com/game/favicon.svg
```

预期依次为 301、200、200。浏览器开发者工具中 `/game/assets/` 下的 JS/CSS 应返回 200；缺失资源应返回 404。网页是 hash 路由，游戏链接例如 `/game/#/play/match3`，刷新游戏页面也能正常打开。

静态 JS/CSS 使用长期缓存，index.html 使用 no-cache，便于更新版本后加载最新资源。网站不需要 Node.js 服务器或新增 API 转发。

本地构建已验证；目标 Linux 服务器的完整 Nginx 配置仍需执行 `nginx -t` 验证。

参考：[Nginx 请求如何选择 server 和 location](https://nginx.org/en/docs/http/request_processing.html)、[root / try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#root)。
