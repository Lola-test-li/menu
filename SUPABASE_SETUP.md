# Supabase 云同步设置

这个菜单现在支持两种模式：

- 没有 Supabase 配置：继续使用当前浏览器本地数据。
- 配好 Supabase：手机和电脑会读写同一份云端菜单，手机上传的图片电脑也能看到。

## 需要买什么

先用 Supabase Free 免费项目就够了。菜品照片会占用 Storage 空间，后续如果图片特别多、访问量很大，再考虑升级付费套餐。

## 设置步骤

1. 在 Supabase 新建一个项目。
2. 打开项目里的 SQL Editor，把 `supabase-schema.sql` 的内容全部复制进去运行。
3. 在 Project Settings -> API 里复制：
   - Project URL
   - anon public key
4. 在 `app` 目录新建 `app/.env.local`，填入：

```env
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public key
VITE_SUPABASE_BUCKET=menu-images
VITE_MENU_ID=main
```

5. 重新构建并发布 GitHub Pages。

`anon public key` 会进入网页前端，这是 Supabase 的正常用法。当前 SQL 为了让亲友不用登录也能上传和删除，开放了菜单表和图片桶的读写权限。这个适合私下分享链接；如果以后要公开给很多人用，建议再加登录或管理密码。
