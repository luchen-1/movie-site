# Render 长期部署说明

这个项目已经按 Render Web Service + Persistent Disk 的方式准备好了，适合长期在线运行。

## 部署前提

1. 把当前项目推到 GitHub、GitLab 或 Bitbucket。
2. 确认仓库根目录包含 `render.yaml`。
3. 如果你要保留现在本地的评论数据，先备份 `data/cinepulse.db`。

## Render 上的创建方式

1. 登录 Render。
2. 进入 `New > Blueprint`。
3. 连接你的代码仓库。
4. 让 Render 读取仓库根目录的 `render.yaml`。
5. 确认将创建一个 Node Web Service，区域是 `singapore`，实例类型是 `starter`。
6. 确认磁盘会挂载到 `/var/data`，数据库文件路径是 `/var/data/cinepulse.db`。
7. 点击创建并等待首次构建完成。

首次部署完成后，你会拿到一个稳定的 `*.onrender.com` 地址。

## Blueprint 已包含的关键配置

- 构建命令：`npm ci --include=dev && npm run build`
- 启动命令：`npm run start`
- 健康检查：`/healthz`
- 时区：`Asia/Shanghai`
- 豆瓣城市：`shanghai`
- 持久化目录：`/var/data`
- SQLite 路径：`/var/data/cinepulse.db`
- 启动后自动同步：开启
- 定时同步：每 6 小时一次
- 管理同步令牌：由 Render 自动生成

## 首次部署后的建议操作

1. 打开服务的 `Environment` 页面，记录 `ADMIN_SYNC_TOKEN`。
2. 打开站点首页和 `/healthz`，确认都返回正常。
3. 在 `Logs` 页面确认启动时出现同步成功日志。
4. 如果你有自己的域名，到 `Settings > Custom Domains` 里绑定域名。

## 导入你本地已有数据

如果你想把本地 SQLite 数据带到 Render：

1. 先完成一次 Render 部署，让磁盘创建出来。
2. 通过 Render Shell 或文件传输，把本地的 `data/cinepulse.db` 上传到 `/var/data/cinepulse.db`。
3. 重新部署或重启服务。

## 运行方式上的限制

- 当前项目使用 SQLite + Render Disk，适合单实例长期运行。
- 不适合多实例横向扩容。
- 如果以后访问量明显增大，建议把 SQLite 迁移到 Render Postgres。
