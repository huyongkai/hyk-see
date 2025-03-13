import { addReplaceHandler } from "./replace";
import { HandleEvents } from "./handleEvents";
import { breadcrumb } from "./breadcrumb";
import { EVENTTYPES, STATUS_CODE } from "@hyk-see/common";
import { htmlElementAsString, getTimestamp } from "@hyk-see/utils";

export function setupReplace() {
  // 白屏检测
  addReplaceHandler({
    callback: () => {
      HandleEvents.handleWhiteScreen();
    },
    type: EVENTTYPES.WHITESCREEN,
  });

  // 重写 XMLHttpRequest
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHttp(data, EVENTTYPES.XHR);
    },
    type: EVENTTYPES.XHR,
  });

  // 重写 fetch
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHttp(data, EVENTTYPES.FETCH);
    },
    type: EVENTTYPES.FETCH,
  });

  // 捕获错误
  addReplaceHandler({
    callback: (error) => {
      HandleEvents.handleError(error);
    },
    type: EVENTTYPES.ERROR,
  });

  // 监听 history 模式路由的变化
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleHistory(data);
    },
    type: EVENTTYPES.HISTORY,
  });

  // 添加 handleUnhandledRejection 事件
  addReplaceHandler({
    callback: (data) => {
      HandleEvents.handleUnhandledRejection(data);
    },
    type: EVENTTYPES.UNHANDLEDREJECTION,
  });

  // 监听 click 事件
  addReplaceHandler({
    callback: (data) => {
      // 获取 html 信息
      const htmlString = htmlElementAsString(data.data.activeElement);
      if (htmlString) {
        breadcrumb.push({
          type: EVENTTYPES.CLICK,
          status: STATUS_CODE.OK,
          category: breadcrumb.getCategory(EVENTTYPES.CLICK),
          data: htmlString,
          time: getTimestamp(),
        });
      }
    },
    type: EVENTTYPES.CLICK,
  });

  // 监听 hashchange 事件
  addReplaceHandler({
    callback: (event) => {
      HandleEvents.handleHashChange(event);
    },
    type: EVENTTYPES.HASHCHANGE,
  });
}
