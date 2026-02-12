# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Chrome 浏览器扩展，用于批量下载 QQ 空间相册照片。项目采用纯静态开发，无需构建过程。

## 开发命令

```bash
# 代码格式化
npx prettier --write src/

# 实时监听格式化（可选）
npx prettier --write src/ --watch
```

## 加载扩展进行测试

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录

## 架构说明

### 数据流向

```
QQ 相册页面 → background.js (拦截请求) → chrome.storage
                                            ↓
popup.html (用户点击下载) ← chrome.storage
              ↓
       popup.js (构建分页请求获取照片列表)
              ↓
       photoDownloader.js (Web Worker 下载图片)
              ↓
           JSZip 打包 → 触发浏览器下载
```

### 核心模块

| 文件 | 职责 |
|------|------|
| `manifest.json` | Chrome 扩展配置，定义权限和入口点 |
| `background.js` | 后台脚本，使用 `webRequest` API 拦截 QQ 相册 API 请求 |
| `popup.js` | 主业务逻辑，处理分页获取照片数据、启动下载 |
| `photoDownloader.js` | Web Worker，在后台线程下载图片并打包为 ZIP |

### 关键设计

1. **请求拦截机制**: `background.js` 监听特定 URL 模式的请求，将 URL 存储到 `chrome.storage.local`
2. **分页处理**: QQ 相册 API 单次最多返回 500 张照片，`getAlbumPhotoList()` 通过循环 `pageStart` 参数获取全部数据
3. **Web Worker**: 下载图片的耗时操作在独立线程执行，避免阻塞 UI
4. **响应式数据**: API 返回的是 JSONP 格式（`callback({...})`），需要手动解析

### API 端点

```
*://h5.qzone.qq.com/proxy/domain/photo.qzone.qq.com/fcgi-bin/cgi_list_photo*
```

关键参数:
- `pageStart`: 起始位置（0, 500, 1000...）
- `pageNum`: 每页数量（最大 500）

### 响应结构

```javascript
{
  data: {
    totalInAlbum: number,    // 相册照片总数
    topic: { name: string }, // 相册名称
    photoList: [             // 照片列表
      { name: string, url: string }
    ]
  }
}
```

## 注意事项

- 不支持旅游相册（API 接口不同）
- 请求需要携带用户 Cookie (`credentials: 'include'`)
- 代码格式化使用 Prettier，配置在 `.prettierrc.js`
