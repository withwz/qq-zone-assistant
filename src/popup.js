/*
 * @Author: wz && vgqk@qq.com
 * @Date: 2024-12-14 18:49:41
 *
 * Copyright (c) 2024 by wz, All Rights Reserved.
 */

// 相册名称
let albumTitle = '';

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('downloadAblum');
  button.addEventListener('click', () => {
    logMessage('下载按钮被点击了!');

    // 从 chrome.storage 获取 URL
    chrome.storage.local.get(['albumUrl'], (result) => {
      const albumUrl = result.albumUrl;
      if (albumUrl) {
        logMessage('chrome.storage 获取的 URL：', albumUrl);
        updateButtonState(true);
        downloadAlbumData(albumUrl); // 使用获取到的 URL
      } else {
        alert('没有获取到 albumUrl');
      }
    });
  });
});

/**
 * 下载相册数据
 * @param {*} albumUrl
 * @returns
 */
async function downloadAlbumData(albumUrl) {
  if (!albumUrl) {
    updateButtonState(false);
    alert('没有获取到 albumUrl');
    return;
  }

  const downloadBox = document.getElementById('downloadBox');
  downloadBox.style.display = 'block'; // 显示下载盒子

  const photoList = await getAlbumPhotoList(albumUrl);
  const resultArray = photoList.map((photo) => ({
    name: photo.name,
    url: photo.url,
  }));

  downloadPhotos(resultArray);
}

/**
 * 获取相册全部数据
 * @param {*} url
 * @returns
 */
async function getAlbumPhotoList(url) {
  // 解析 URL
  url = buildFetchUrl(url);

  // 获取初始的照片列表
  const photoData = await fetchPhotoList(url);
  const totalInAlbum = photoData.totalInAlbum;
  logMessage('相册照片总数：', totalInAlbum);
  let photoList = photoData.photoList || [];

  // 如果总数超过 500，分页进行获取
  if (totalInAlbum > 500) {
    for (let pageStart = 500; pageStart < totalInAlbum; pageStart += 500) {
      const nextPageUrl = buildFetchUrl(url, pageStart);
      const photoData = await fetchPhotoList(nextPageUrl);
      const nextPagePhotos = photoData.photoList;
      photoList = photoList.concat(nextPagePhotos);
    }
  }

  logMessage('即将下载的数据列表：', photoList);
  return photoList;
}

/**
 * 获取照片列表的辅助函数
 * @param {*} url
 * @returns
 */
async function fetchPhotoList(url) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // 这会发送包含cookie的请求
  });
  const data = await response.text();
  const start = data.indexOf('(') + 1;
  const end = data.lastIndexOf(')');
  const jsonData = JSON.parse(data.slice(start, end));
  const albumData = jsonData.data;
  logMessage('获取到的相册数据：', jsonData);

  // 展示正在下载的相册
  albumTitle = albumData.topic.name;
  document.getElementById('albumTitle').textContent = albumTitle; // 设置相册标题

  // 返回照片列表和总数
  return {
    photoList: albumData.photoList,
    totalInAlbum: albumData.totalInAlbum,
  };
}

/**
 * 解析url
 * @param {*} albumUrl
 * @param {*} pageStart
 * @param {*} pageNum
 * @returns
 */
function buildFetchUrl(albumUrl, pageStart = 0, pageNum = 500) {
  const urlParts = albumUrl.split('?');
  const baseUrl = urlParts[0];
  const queryString = urlParts[1];

  // 将查询字符串转换为对象
  const params = {};
  queryString.split('&').forEach((param) => {
    const [key, value] = param.split('=');
    params[key] = value;
  });

  // 修改 pageStart 和 pageNum 的值
  params['pageStart'] = pageStart;
  params['pageNum'] = pageNum;

  // 重新构建查询字符串
  const newQueryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  // 重新构建完整的 URL
  albumUrl = `${baseUrl}?${newQueryString}`;

  // 输出修改后的 URL
  return albumUrl;
}

/**
 * 打包下载照片zip
 * @param {*} list
 */
function downloadPhotos(list) {
  const progressBar = document.getElementById('progressBar');
  const downloadBox = document.getElementById('downloadBox');
  progressBar.value = 0; // 初始化进度条

  const worker = new Worker('photoDownloader.js'); // 引入 Web Worker

  // 向 Worker 发送任务
  worker.postMessage(list);

  // 监听 Worker 的消息
  worker.onmessage = (event) => {
    const { type, data } = event.data;

    if (type === 'progress') {
      progressBar.value = data; // 更新进度条
    } else if (type === 'complete') {
      // 下载完成，生成 ZIP 文件
      const { zipContent } = data;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = 'photos.zip'; // 设置下载文件名
      document.body.appendChild(link);
      link.click(); // 触发下载
      document.body.removeChild(link);

      setTimeout(() => {
        downloadBox.style.display = 'none'; // 隐藏进度条
        updateButtonState(false);
        alert('下载完成');
      }, 2000);

      worker.terminate(); // 任务完成后终止 Worker
    }
  };
}

/**
 * 设置按钮状态的函数
 * @param {*} isDisabled
 */
function updateButtonState(isDisabled) {
  const button = document.getElementById('downloadAblum');
  button.disabled = isDisabled;
}

/**
 * console日志封装
 * @param  {...any} messages
 */
function logMessage(...messages) {
  const stack = new Error().stack; // 获取调用栈
  const stackLines = stack.split('\n'); // 将堆栈信息按行分割
  const callerLine = stackLines[2]; // 获取调用该函数的行信息

  // 提取文件名和行号
  const match = callerLine.match(/\((.*):(\d+):\d+\)/);
  const location = match ? `${match[1]}:${match[2]}` : 'unknown location';

  // 打印日志
  console.log(`[${location}]`, ...messages); // 使用扩展运算符打印所有消息
}
