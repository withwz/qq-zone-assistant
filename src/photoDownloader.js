/*
 * @Author: wz && vgqk@qq.com
 * @Date: 2024-12-15 02:39:11
 *
 * Copyright (c) 2024 by wz, All Rights Reserved.
 */

importScripts('jszip.min.js');

self.onmessage = async (event) => {
  const list = event.data;
  const zip = new JSZip();

  const totalImages = list.length;
  let downloadedImages = 0;

  for (const photo of list) {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    zip.file(`${photo.name}.png`, blob); 
    downloadedImages++;

    // 通知主线程进度
    self.postMessage({
      type: 'progress',
      data: (downloadedImages / totalImages) * 100,
    });
  }

  // 生成 ZIP 文件
  const zipContent = await zip.generateAsync({ type: 'blob' });
  self.postMessage({ type: 'complete', data: { zipContent } });
};
