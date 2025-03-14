import { on, _global } from "@hyk-see/utils";
import { onLCP, onFID, onCLS, onFCP, onTTFB } from "web-vitals";

let firstScreenPaint = 0;
let isOnLoaded = false;
let timer = null;
let observer = null;
let entries = [];

export function getWebVitals(callback) {
  if (isSafari()) {
    getFID((res) => callback(res));
    getCLS((res) => callback(res));
    getLCP((res) => callback(res));
    getTTFB((res) => callback(res));
    getFCP((res) => callback(res));
  } else {
    onLCP((res) => callback(res));
    onFID((res) => callback(res));
    onCLS((res) => callback(res));
    onFCP((res) => callback(res));
    onTTFB((res) => callback(res));
  }

  // 首屏加载时间
  getFirstScreenPaint((res) => {
    const data = {
      name: "FSP",
      value: res,
      rating: res > 2500 ? "poor" : "good",
    };
    callback(data);
  });
}

export function getResource() {
  const entries = performance.getEntriesByType("resource");
  // 过滤
  let list = entries.filter((entry) => {
    return (
      ["fetch", "xmlhttprequest", "beacon"].indexOf(entry.initiatorType) === -1
    );
  });

  if (list.length) {
    list = JSON.parse(JSON.stringify(list));
    list.forEach((entry) => {
      entry.isCache = isCache(entry);
    });
  }

  return list;
}

// 强缓存命中 协商缓存命中
export function isCache(entry) {
  return (
    entry.transferSize === 0 ||
    (entry.transferSize !== 0 && entry.encodedBodySize === 0)
  );
}

/**  
// Safari
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"

// Chrome
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"

// Edge
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54"
*/
export function isSafari() {
  // 特性检测
  const isSafariUA =
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  // 检查 Safari 特有 API
  const hasSafariFeatures =
    "safari" in window || "pushNotification" in window.safari;

  return isSafariUA && hasSafariFeatures;
}

function getFirstScreenPaint(callback) {
  if ("requestIdleCallback" in _global) {
    requestIdleCallback((deadline) => {
      // timeRemaining 返回当前帧剩余时间
      if (deadline.timeRemaining() > 0) {
        observeFirstScreenPaint(callback);
      }
    });
  } else {
    // 降级处理：直接执行
    observeFirstScreenPaint(callback);
  }
}

export function observeFirstScreenPaint(callback) {
  // 忽略样式、脚本等非内容标签
  const ignoreDOMList = ["STYLE", "SCRIPT", "LINK"];
  observer = new MutationObserver((mutationList) => {
    checkDOMChange(callback);
    const entry = { children: [], startTime: 0 };
    for (const mutation of mutationList) {
      // 检查是否有新增节点且目标在可视区域内
      if (mutation.addedNodes.length && isInScreen(mutation.target)) {
        for (const node of mutation.addedNodes) {
          // 过滤条件：
          // 1. 是元素节点 (nodeType === 1)
          // 2. 不是被忽略的标签
          // 3. 在可视区域内
          if (
            node.nodeType === 1 &&
            !ignoreDOMList.includes(node.tagName) &&
            isInScreen(node)
          ) {
            entry.children.push(node);
          }
        }
      }
    }
    if (entry.children.length) {
      entries.push(entry);
      entry.startTime = new Date().getTime(); // 记录变化时间点
    }
  });
  observer.observe(document, {
    childList: true, // 监听节点增删
    subtree: true, // 监听所有后代节点
    characterData: true, // 监听文本变化
    attributes: true, // 监听属性变化
  });
}

const viewportWidth = _global.innerWidth;
const viewportHeight = _global.innerHeight;
// dom 是否在屏幕内
function isInScreen(dom) {
  const rectInfo = dom.getBoundingClientRect();
  if (rectInfo.left < viewportWidth && rectInfo.top < viewportHeight) {
    return true;
  }
  return false;
}

function checkDOMChange(callback) {
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(() => {
    if (document.readyState === "complete") {
      isOnLoaded = true;
    }

    if (isOnLoaded) {
      observer && observer.disconnect();
      // document.readyState === 'complete' 时，计算首屏渲染时间
      firstScreenPaint = getRenderTime();
      entries = [];
      callback && callback(firstScreenPaint);
    } else {
      checkDOMChange(callback);
    }
  });
}

function getRenderTime() {
  let startTime = 0;
  entries.forEach((entry) => {
    if (entry.startTime > startTime) {
      startTime = entry.startTime;
    }
  });

  // performance.timing.navigationStart 是页面加载开始时间
  return startTime - performance.timing.navigationStart;
}

export function getFCP(callback) {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        observer.disconnect();
        callback({
          name: "FCP",
          value: entry.startTime,
          rating: entry.startTime > 2500 ? "poor" : "good",
        });
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "paint", buffered: true });
}

export function getLCP(callback) {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      // 获取到 LCP 后立即停止观察
      observer.disconnect();

      // 回调返回 LCP 信息
      callback({
        name: "LCP",
        value: entry.startTime, // LCP 发生的时间点
        rating: entry.startTime > 2500 ? "poor" : "good", // 性能评级
      });
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "largest-contentful-paint", buffered: true });
}

export function getFID(callback) {
  const entryHandler = (entryList) => {
    for (const entry of entryList.getEntries()) {
      observer.disconnect();
      const value = entry.processingStart - entry.startTime;
      callback({
        name: "FID",
        value,
        rating: value > 100 ? "poor" : "good",
      });
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "first-input", buffered: true });
}

export function getTTFB(callback) {
  on(_global, "load", function () {
    const { responseStart, navigationStart } = _global.performance.timing;
    const value = responseStart - navigationStart;
    callback({
      name: "TTFB",
      value,
      rating: value > 100 ? "poor" : "good",
    });
  });
}

export function getCLS(callback) {
  let clsValue = 0; // 最终的 CLS 值
  let sessionValue = 0; // 当前会话的 CLS 值
  let sessionEntries = []; // 当前会话的布局偏移记录

  const entryHandler = (entryList) => {
    for (const entry of entryList.getEntries()) {
      // 过滤用户输入导致的布局偏移
      // hadRecentInput: 最近500ms内是否有用户输入
      // 只计算非用户输入导致的布局偏移
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // 如果条目与上一条目的相隔时间小于 1 秒且
        // 与会话中第一个条目的相隔时间小于 5 秒，那么将条目包含在当前会话中。否则，开始一个新会话。
        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          // 属于当前会话
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          // 开启新会话
          sessionValue = entry.value;
          sessionEntries = [entry];
        }

        // 如果当前会话值大于当前 CLS 值，那么更新 CLS 及其相关条目
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          observer.disconnect();
          callback({
            name: "CLS",
            value: clsValue,
            rating: clsValue > 2500 ? "poor" : "good",
          });
        }
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "layout-shift", buffered: true });
}
