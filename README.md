# CinePulse

一个重新给正在上映电影打分的站点。它会低频抓取豆瓣 `正在上映` 页面作为片单来源，但本站评分与评论完全独立计算。

## 本地运行

```bash
npm install
npm run dev
```

默认地址是 `http://localhost:3000`。

## 关键能力

- 自动同步豆瓣上海正在上映片单
- 电影详情页、本站评分与评论
- `node-cron` 定时同步
- SQLite 持久化
- `POST /api/sync` 手动触发同步

## 可选环境变量

- `PORT=3000`
- `DOUBAN_CITY=shanghai`
- `DOUBAN_SYNC_CRON=17 */6 * * *`
- `APP_TIMEZONE=Asia/Shanghai`
- `ADMIN_SYNC_TOKEN=your-token`
- `SYNC_ON_STARTUP=true`

## 质量命令

```bash
npm run test
npm run lint
npm run build
```

## Render 部署

仓库根目录已包含 `render.yaml`，可直接按 Blueprint 或普通 Web Service 方式部署。

- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check: `/healthz`
- Persistent Disk Mount Path: `/var/data`

为什么必须加磁盘：

- Render 默认文件系统是临时的，重启或重新部署会丢失本地 SQLite 数据
- 当前项目使用 SQLite，因此在 Render 上必须给 Web Service 挂持久化磁盘

注意：

- 自动同步目前由应用内 `node-cron` 执行，单实例部署即可
- 如果后续改成 Render Cron Job，建议同时把数据库迁移到 Render Postgres
