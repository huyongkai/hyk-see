import { EVENTTYPES, BREADCRUMBTYPES } from "@hyk-see/common";
import { getTimestamp, _support } from "@hyk-see/utils";

// 创建用户行为类
export class Breadcrumb {
  // 最大用户行为数量
  maxBreadcrumbs = 20;
  // 用户自定义的 hook
  beforePushBreadcrumb = null;
  // 用户行为栈
  stack = [];

  constructor() {
    this.stack = [];
  }

  // 添加用户栈
  push(data) {
    if (typeof this.beforePushBreadcrumb === "function") {
      // 执行用户自定义的 hook
      const result = this.beforePushBreadcrumb(data);
      if (!result) return;
      this.immediatePush(result);
      return;
    }
    this.immediatePush(data);
  }

  immediatePush(data) {
    data.time || (data.time = getTimestamp());

    if (this.stack.length >= this.maxBreadcrumbs) {
      this.stack.shift();
    }

    this.stack.push(data);
    this.stack.sort((a, b) => a.time - b.time);
  }

  shift() {
    this.stack.shift();
  }

  clear() {
    this.stack = [];
  }

  getStack() {
    return this.stack;
  }

  getCategory(type) {
    switch (type) {
      // 接口请求
      case EVENTTYPES.XHR:
      case EVENTTYPES.FETCH:
        return BREADCRUMBTYPES.HTTP;

      // 用户点击
      case EVENTTYPES.CLICK:
        return BREADCRUMBTYPES.CLICK;

      // 路由切换
      case EVENTTYPES.HISTORY:
      case EVENTTYPES.HASHCHANGE:
        return BREADCRUMBTYPES.ROUTE;

      // 加载资源
      case EVENTTYPES.RESOURCE:
        return BREADCRUMBTYPES.RESOURCE;

      // JS 代码报错
      case EVENTTYPES.UNHANDLEDREJECTION:
      case EVENTTYPES.ERROR:
        return BREADCRUMBTYPES.CODEERROR;

      // 用户自定义
      default:
        return BREADCRUMBTYPES.CUSTOM;
    }
  }

  bindOptions(initOptions) {
    const { maxBreadcrumbs, beforePushBreadcrumb } = initOptions;

    validateOptions(maxBreadcrumbs, "maxBreadcrumbs", "number") &&
      (this.maxBreadcrumbs = maxBreadcrumbs || 20);

    validateOptions(beforePushBreadcrumb, "beforePushBreadcrumb", "function") &&
      (this.beforePushBreadcrumb = beforePushBreadcrumb);
  }
}

const breadcrumb =
  _support.breadcrumb || (_support.breadcrumb = new Breadcrumb());

export { breadcrumb };
