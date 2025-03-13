import { _global, _support } from "@hyk-see/utils";
import { STATUS_CODE } from "@hyk-see/common";

export function openWhiteScreen(
  callback,
  { skeletonProject, whiteBoxElements }
) {
  let _whiteLoopNum = 0;
  const _skeletonInitList = []; // 存储初次采样点
  let _skeletonNowList = []; // 存储当前采样点

  //* 这里是个难理解的点
  // 项目有骨架屏
  if (skeletonProject) {
    // 当页面未完全加载时就开始检测
    if (document.readyState !== "complete") {
      idleCallback();
    }
  } else {
    // 等待页面完全加载后再检测
    if (document.readyState === "complete") {
      idleCallback();
    } else {
      // 如果页面未加载完，等待 load 事件
      _global.addEventListener("load", idleCallback);
    }
  }

  // 选中 dom 点的名称
  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      return "." + element.className.split(" ").filter(Boolean).join(".");
    }

    return element.nodeName.toLowerCase();
  }

  // 判断采样点是否为容器节点
  function isContainer(element) {
    const selector = getSelector(element);
    if (skeletonProject) {
      _whiteLoopNum
        ? _skeletonNowList.push(selector)
        : _skeletonInitList.push(selector);
    }

    return whiteBoxElements.indexOf(selector) !== -1;
  }

  /**
   * ! 白屏检测点基本原理
   * 在页面上设置了17个采样点（去除中心重复点）
   * 检查每个采样点最上层的元素是否为容器节点
   * 如果17个点都是容器节点，则认为页面白屏
   * 对于有骨架屏的页面，还会比较前后 DOM 结构是否变化
   */
  // 使用采样点检测方法来判断页面是否白屏
  function sampling() {
    // 统计空容器节点数量
    let emptyPoints = 0;
    for (let i = 0; i <= 9; i++) {
      // 横向采样：在页面中间水平线上取9个点
      const xElements = document.elementsFromPoint(
        (_global.innerWidth * i) / 10, // x 坐标按屏幕宽度均分
        _global.innerHeight / 2 // y 坐标在屏幕中间
      );

      // 纵向采样：在页面中间垂直直线上取 9 个点
      const yElements = document.elementsFromPoint(
        _global.innerWidth / 2, // x 坐标在屏幕中间
        (_global.innerHeight * i) / 10 // y 坐标按屏幕高度均分
      );

      if (isContainer(xElements[0])) {
        emptyPoints++;
      }

      // 中心点只计算一次（避免重复计算十字交叉点）
      if (i !== 5) {
        if (isContainer(yElements[0])) {
          emptyPoints++;
        }
      }
    }

    // emptyPoints == 17 表示所有采样点都是容器节点（如 html、body、#app 等）
    // 页面正常渲染，停止轮训
    if (emptyPoints !== 17) {
      // 项目有骨架屏
      if (skeletonProject) {
        // 第一次不比较
        if (!_whiteLoopNum) return openWhiteLoop();

        //  比较前后 dom 是否一致，对比是否还是骨架屏
        if (_skeletonNowList.join() == _skeletonInitList.join()) {
          return callback({ status: STATUS_CODE.ERROR });
        }
      }
      // 停止轮询
      if (_support._loopTimer) {
        clearTimeout(_support._loopTimer);
        _support._loopTimer = null;
      }
    } else {
      // 开启轮训
      if (!_support._loopTimer) {
        openWhiteLoop();
      }
    }

    // 17 个点都是容器节点算作白屏
    callback({
      status: emptyPoints === 17 ? STATUS_CODE.ERROR : STATUS_CODE.OK,
    });
  }

  // 开启白屏轮训
  function openWhiteLoop() {
    if (_support._loopTimer) return;

    _support._loopTimer = setInterval(() => {
      if (skeletonProject) {
        _whiteLoopNum++; // 记录检测次数
        _skeletonNowList = []; // 清空当前采样列表
      }

      idleCallback(); // 使用空闲时间执行检测
    }, 1000);
  }

  function idleCallback() {
    // 支持 requestIdleCallback 的现代浏览器
    if ("requestIdleCallback" in _global) {
      // timeRemaining: 表示当前空闲时间的剩余时间
      requestIdleCallback((deadline) => {
        if (deadline.timeRemaining() > 0) {
          sampling(); // 在空闲时执行采样
        }
      });
    } else {
      // 不支持的浏览器直接执行
      sampling();
    }
  }
}
