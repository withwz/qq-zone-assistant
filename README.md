# QQ 空间相册下载 Chrome 插件

批量下载 QQ 空间相册照片的浏览器扩展，支持自定义下载数量限制。

![界面截图](image/img.png)

## 功能特点

- 批量下载 QQ 空间普通相册的全部照片
- 支持设置最大下载数量（默认 500 张）
- 自动打包为 ZIP 文件下载
- 实时显示下载进度

## 使用方法

### 安装插件

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目目录

### 下载相册

1. 登录 [QQ 空间](https://qzone.qq.com/)
2. 进入「我的相册」→ 选择具体相册
3. 点击插件图标，设置最大下载数量（留空表示全部）
4. 点击「下载相册」按钮

> **注意**：旅游相册接口不同，暂不支持。

## 工作原理

### 数据流向

```
QQ 相册页面 → background.js (拦截请求) → chrome.storage
                                            ↓
popup.html (用户点击下载) ← chrome.storage
              ↓
       popup.js (分页获取照片列表)
              ↓
       photoDownloader.js (Web Worker 下载)
              ↓
           JSZip 打包 → 浏览器下载
```

### 核心流程

1. **请求拦截**：拦截 QQ 相册 API 请求 `*://h5.qzone.qq.com/proxy/domain/photo.qzone.qq.com/fcgi-bin/cgi_list_photo*`，获取请求参数

2. **分页获取**：该接口单次最多返回 500 张照片，插件通过 `pageStart` 参数循环获取全部数据

3. **打包下载**：使用 Web Worker 在后台下载图片，通过 JSZip 打包成 ZIP 文件

## 项目结构

```
└── src
    ├── assets
    │   └── icon.png           # 扩展图标
    ├── background.js          # 后台脚本，拦截请求
    ├── jszip.min.js           # JSZip 库
    ├── photoDownloader.js     # Web Worker，下载图片
    ├── popup.html             # 弹窗界面
    ├── popup.js               # 主逻辑
    └── styles.css             # 样式文件
```

## 故障排查

如果遇到问题：
- 右键插件图标 → 检查弹出窗口
- 右键插件图标空白处 → 检查后台控制台
- 查看网络请求是否正常

---

^ ⑉・ᴗ・⑉ ૮ ˃ 感谢支持<br />
<img src="https://github.com/user-attachments/assets/8b12eac8-cb25-435d-b098-bd4de82f8777" width="300" />
