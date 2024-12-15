/*
 * @Author: wz && vgqk@qq.com
 * @Date: 2024-12-14 22:39:46
 *
 * Copyright (c) 2024 by wz, All Rights Reserved.
 */
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // 检查请求的 URL 是否匹配
    if (
      details.url.includes(
        'https://h5.qzone.qq.com/proxy/domain/photo.qzone.qq.com/fcgi-bin/cgi_list_photo'
      )
    ) {
      console.log('拦截到请求:', details.url);

      // 存储 URL 到 chrome.storage
      chrome.storage.local.set({ albumUrl: details.url }, () => {
        console.log('URL 已存储:', details.url);
      });
    }
  },
  {
    urls: [
      '*://h5.qzone.qq.com/proxy/domain/photo.qzone.qq.com/fcgi-bin/cgi_list_photo*',
    ],
  } // 匹配的 URL 模式
);
